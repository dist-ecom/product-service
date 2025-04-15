import { Injectable, NotFoundException, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface ElasticsearchProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  merchantId: string;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly elasticsearchService: ElasticsearchService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string, userRole: string): Promise<Product> {
    // Set the merchantId for the product
    const productData = {
      ...createProductDto,
      merchantId: userRole.toUpperCase() === 'MERCHANT' ? userId : null
    };

    const createdProduct = new this.productModel(productData);
    const savedProduct = await createdProduct.save();

    // Index the product in Elasticsearch
    await this.elasticsearchService.index({
      index: 'products',
      id: savedProduct._id.toString(),
      document: {
        name: savedProduct.name,
        description: savedProduct.description,
        price: savedProduct.price,
        category: savedProduct.category,
        tags: savedProduct.tags,
        merchantId: savedProduct.merchantId
      },
    });

    // Invalidate cache for products list
    await this.cacheManager.del('products:all');
    
    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    // Try to get from cache first
    const cachedProducts = await this.cacheManager.get<Product[]>('products:all');
    if (cachedProducts) {
      this.logger.log('Cache HIT: Retrieved all products from cache');
      return cachedProducts;
    }
    
    this.logger.log('Cache MISS: Fetching all products from database');
    // If not in cache, get from database
    const products = await this.productModel.find().exec();
    
    // Store in cache
    await this.cacheManager.set('products:all', products);
    this.logger.log('Stored all products in cache');
    
    return products;
  }

  async findOne(id: string): Promise<Product> {
    // Try to get from cache first
    const cachedProduct = await this.cacheManager.get<Product>(`product:${id}`);
    if (cachedProduct) {
      this.logger.log(`Cache HIT: Retrieved product ${id} from cache`);
      return cachedProduct;
    }
    
    this.logger.log(`Cache MISS: Fetching product ${id} from database`);
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    // Store in cache
    await this.cacheManager.set(`product:${id}`, product);
    this.logger.log(`Stored product ${id} in cache`);
    
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string, userRole: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if the user is authorized to update the product
    if (userRole.toUpperCase() === 'MERCHANT' && product.merchantId !== userId) {
      throw new ForbiddenException('You do not have permission to update this product');
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    // Update the product in Elasticsearch
    await this.elasticsearchService.update({
      index: 'products',
      id: id,
      doc: {
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        category: updatedProduct.category,
        tags: updatedProduct.tags,
        merchantId: updatedProduct.merchantId
      },
    });
    
    // Invalidate cache
    await this.cacheManager.del(`product:${id}`);
    await this.cacheManager.del('products:all');
    await this.cacheManager.del(`products:category:${updatedProduct.category}`);
    if (updatedProduct.tags && updatedProduct.tags.length > 0) {
      for (const tag of updatedProduct.tags) {
        await this.cacheManager.del(`products:tag:${tag}`);
      }
    }
    await this.cacheManager.del(`products:merchant:${updatedProduct.merchantId}`);

    return updatedProduct;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const product = await this.productModel.findById(id).exec();
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    // Check if the user is authorized to delete the product
    if (userRole.toUpperCase() === 'MERCHANT' && product.merchantId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this product');
    }

    // Invalidate cache before deletion
    await this.cacheManager.del(`product:${id}`);
    await this.cacheManager.del('products:all');
    await this.cacheManager.del(`products:category:${product.category}`);
    if (product.tags && product.tags.length > 0) {
      for (const tag of product.tags) {
        await this.cacheManager.del(`products:tag:${tag}`);
      }
    }
    await this.cacheManager.del(`products:merchant:${product.merchantId}`);

    await this.productModel.findByIdAndDelete(id).exec();

    // Remove the product from Elasticsearch
    await this.elasticsearchService.delete({
      index: 'products',
      id: id,
    });
  }

  async search(query: string) {
    // Try to get from cache first
    const cacheKey = `search:${query}`;
    const cachedResults = await this.cacheManager.get(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }
    
    const { hits } = await this.elasticsearchService.search<ElasticsearchProduct>({
      index: 'products',
      query: {
        multi_match: {
          query: query,
          fields: ['name', 'description', 'category', 'tags'],
        },
      },
    });

    const results = hits.hits
      .filter(hit => hit._source)
      .map(hit => ({
        _id: hit._id,
        name: hit._source!.name,
        description: hit._source!.description,
        price: hit._source!.price,
        category: hit._source!.category,
        tags: hit._source!.tags,
        merchantId: hit._source!.merchantId
      }));
      
    // Store in cache with a shorter TTL for search results (e.g., 10 minutes)
    await this.cacheManager.set(cacheKey, results, 600000);
    
    return results;
  }

  async findByCategory(category: string): Promise<Product[]> {
    // Try to get from cache first
    const cacheKey = `products:category:${category}`;
    const cachedProducts = await this.cacheManager.get<Product[]>(cacheKey);
    if (cachedProducts) {
      return cachedProducts;
    }
    
    const products = await this.productModel.find({ category }).exec();
    
    // Store in cache
    await this.cacheManager.set(cacheKey, products);
    
    return products;
  }

  async findByTags(tags: string[]): Promise<Product[]> {
    // For multiple tags, create a composite key
    const tagKey = tags.sort().join(',');
    const cacheKey = `products:tags:${tagKey}`;
    
    // Try to get from cache first
    const cachedProducts = await this.cacheManager.get<Product[]>(cacheKey);
    if (cachedProducts) {
      return cachedProducts;
    }
    
    const products = await this.productModel.find({ tags: { $in: tags } }).exec();
    
    // Store in cache
    await this.cacheManager.set(cacheKey, products);
    
    return products;
  }

  async findByMerchant(merchantId: string): Promise<Product[]> {
    // Try to get from cache first
    const cacheKey = `products:merchant:${merchantId}`;
    const cachedProducts = await this.cacheManager.get<Product[]>(cacheKey);
    if (cachedProducts) {
      return cachedProducts;
    }
    
    const products = await this.productModel.find({ merchantId }).exec();
    
    // Store in cache
    await this.cacheManager.set(cacheKey, products);
    
    return products;
  }
}
