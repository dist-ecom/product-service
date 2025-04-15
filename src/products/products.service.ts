import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly elasticsearchService: ElasticsearchService,
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

    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
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

    await this.productModel.findByIdAndDelete(id).exec();

    // Remove the product from Elasticsearch
    await this.elasticsearchService.delete({
      index: 'products',
      id: id,
    });
  }

  async search(query: string) {
    const { hits } = await this.elasticsearchService.search<ElasticsearchProduct>({
      index: 'products',
      query: {
        multi_match: {
          query: query,
          fields: ['name', 'description', 'category', 'tags'],
        },
      },
    });

    return hits.hits
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
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.productModel.find({ category }).exec();
  }

  async findByTags(tags: string[]): Promise<Product[]> {
    return this.productModel.find({ tags: { $in: tags } }).exec();
  }

  async findByMerchant(merchantId: string): Promise<Product[]> {
    return this.productModel.find({ merchantId }).exec();
  }
}
