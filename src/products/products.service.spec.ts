import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('ProductsService', () => {
  let service: ProductsService;
  let productModel: Model<ProductDocument>;
  let elasticsearchService: ElasticsearchService;
  let cacheManager: Cache;

  const mockProduct = {
    _id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    category: 'Test Category',
    tags: ['test', 'product'],
    merchantId: 'merchant-123'
  };

  // Create a proper mock for the Mongoose model
  class MockProductModel {
    constructor(private readonly data: any) {
      return {
        ...mockProduct,
        ...data,
        save: jest.fn().mockResolvedValue(mockProduct),
      };
    }

    static find = jest.fn().mockReturnThis();
    static findById = jest.fn().mockReturnThis();
    static findByIdAndUpdate = jest.fn().mockReturnThis();
    static findByIdAndDelete = jest.fn().mockReturnThis();
    static exec = jest.fn().mockResolvedValue(mockProduct);
  }

  const mockElasticsearchService = {
    index: jest.fn(),
    search: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: MockProductModel,
        },
        {
          provide: ElasticsearchService,
          useValue: mockElasticsearchService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productModel = module.get<Model<ProductDocument>>(getModelToken(Product.name));
    elasticsearchService = module.get<ElasticsearchService>(ElasticsearchService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product, index it in Elasticsearch, and invalidate cache', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Test Category',
        tags: ['test', 'product'],
      };
      const userId = 'merchant-123';
      const userRole = 'MERCHANT';

      const result = await service.create(createProductDto, userId, userRole);

      expect(result).toEqual(mockProduct);
      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'products',
        id: mockProduct._id,
        document: {
          name: mockProduct.name,
          description: mockProduct.description,
          price: mockProduct.price,
          category: mockProduct.category,
          tags: mockProduct.tags,
          merchantId: mockProduct.merchantId
        },
      });
      // Verify cache invalidation
      expect(cacheManager.del).toHaveBeenCalledWith('products:all');
    });
  });

  describe('findAll', () => {
    it('should return products from cache when available', async () => {
      const products = [mockProduct];
      
      // Mock cache hit
      mockCacheManager.get.mockResolvedValue(products);
      
      const result = await service.findAll();

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith('products:all');
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it('should fetch products from database and store in cache when cache misses', async () => {
      const products = [mockProduct];
      
      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);
      jest.spyOn(productModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(products),
      } as any);
      
      const result = await service.findAll();

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith('products:all');
      expect(productModel.find).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith('products:all', products);
    });
  });

  describe('findOne', () => {
    it('should return a product from cache when available', async () => {
      // Mock cache hit
      mockCacheManager.get.mockResolvedValue(mockProduct);
      
      const result = await service.findOne('1');

      expect(result).toEqual(mockProduct);
      expect(cacheManager.get).toHaveBeenCalledWith('product:1');
      expect(productModel.findById).not.toHaveBeenCalled();
    });

    it('should fetch product from database and store in cache when cache misses', async () => {
      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      } as any);
      
      const result = await service.findOne('1');

      expect(result).toEqual(mockProduct);
      expect(cacheManager.get).toHaveBeenCalledWith('product:1');
      expect(productModel.findById).toHaveBeenCalledWith('1');
      expect(cacheManager.set).toHaveBeenCalledWith('product:1', mockProduct);
    });

    it('should throw NotFoundException when product is not found', async () => {
      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a product, update Elasticsearch index, and invalidate cache', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };
      const userId = 'merchant-123';
      const userRole = 'MERCHANT';

      const updatedProduct = { ...mockProduct, ...updateProductDto };
      
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      } as any);
      
      jest.spyOn(productModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProduct),
      } as any);

      const result = await service.update('1', updateProductDto, userId, userRole);

      expect(result).toEqual(updatedProduct);
      expect(elasticsearchService.update).toHaveBeenCalledWith({
        index: 'products',
        id: '1',
        doc: {
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          category: updatedProduct.category,
          tags: updatedProduct.tags,
          merchantId: updatedProduct.merchantId
        },
      });
      
      // Verify cache invalidation
      expect(cacheManager.del).toHaveBeenCalledWith('product:1');
      expect(cacheManager.del).toHaveBeenCalledWith('products:all');
      expect(cacheManager.del).toHaveBeenCalledWith(`products:category:${updatedProduct.category}`);
    });

    it('should throw NotFoundException when product is not found', async () => {
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.update('999', {}, 'merchant-123', 'MERCHANT')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when merchant tries to update another merchant\'s product', async () => {
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockProduct,
          merchantId: 'other-merchant'
        }),
      } as any);

      await expect(service.update('1', {}, 'merchant-123', 'MERCHANT')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a product, delete from Elasticsearch, and invalidate cache', async () => {
      const userId = 'merchant-123';
      const userRole = 'MERCHANT';
      
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      } as any);
      
      jest.spyOn(productModel, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      } as any);

      await service.remove('1', userId, userRole);

      expect(elasticsearchService.delete).toHaveBeenCalledWith({
        index: 'products',
        id: '1',
      });
      
      // Verify cache invalidation
      expect(cacheManager.del).toHaveBeenCalledWith('product:1');
      expect(cacheManager.del).toHaveBeenCalledWith('products:all');
      expect(cacheManager.del).toHaveBeenCalledWith(`products:category:${mockProduct.category}`);
    });

    it('should throw NotFoundException when product is not found', async () => {
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove('999', 'merchant-123', 'MERCHANT')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when merchant tries to delete another merchant\'s product', async () => {
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockProduct,
          merchantId: 'other-merchant'
        }),
      } as any);

      await expect(service.remove('1', 'merchant-123', 'MERCHANT')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('search', () => {
    it('should return search results from cache when available', async () => {
      const query = 'test';
      const searchResults = [mockProduct];
      
      // Mock cache hit
      mockCacheManager.get.mockResolvedValue(searchResults);
      
      const result = await service.search(query);

      expect(result).toEqual(searchResults);
      expect(cacheManager.get).toHaveBeenCalledWith(`search:${query}`);
      expect(elasticsearchService.search).not.toHaveBeenCalled();
    });

    it('should search in Elasticsearch and store in cache when cache misses', async () => {
      const query = 'test';
      const searchResults = {
        hits: {
          hits: [
            {
              _id: '1',
              _source: mockProduct,
            },
          ],
        },
      };
      
      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);
      mockElasticsearchService.search.mockResolvedValue(searchResults);
      
      const result = await service.search(query);

      expect(result).toEqual([{
        _id: '1',
        name: mockProduct.name,
        description: mockProduct.description,
        price: mockProduct.price,
        category: mockProduct.category,
        tags: mockProduct.tags,
        merchantId: mockProduct.merchantId
      }]);
      expect(cacheManager.get).toHaveBeenCalledWith(`search:${query}`);
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'products',
        query: {
          multi_match: {
            query: query,
            fields: ['name', 'description', 'category', 'tags'],
          },
        },
      });
      // Verify that search results are cached
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findByCategory', () => {
    it('should return products from cache when available', async () => {
      const category = 'Test Category';
      const products = [mockProduct];
      
      // Mock cache hit
      mockCacheManager.get.mockResolvedValue(products);
      
      const result = await service.findByCategory(category);

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith(`products:category:${category}`);
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it('should fetch products from database and store in cache when cache misses', async () => {
      const category = 'Test Category';
      const products = [mockProduct];
      
      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);
      jest.spyOn(productModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(products),
      } as any);
      
      const result = await service.findByCategory(category);

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith(`products:category:${category}`);
      expect(productModel.find).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(`products:category:${category}`, products);
    });
  });

  describe('findByTags', () => {
    it('should return products from cache when available', async () => {
      const tags = ['test', 'product'];
      const products = [mockProduct];
      
      // Mock cache hit
      mockCacheManager.get.mockResolvedValue(products);
      
      const result = await service.findByTags(tags);

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith(`products:tags:${tags.sort().join(',')}`);
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it('should fetch products from database and store in cache when cache misses', async () => {
      const tags = ['test', 'product'];
      const products = [mockProduct];
      
      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);
      jest.spyOn(productModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(products),
      } as any);
      
      const result = await service.findByTags(tags);

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith(`products:tags:${tags.sort().join(',')}`);
      expect(productModel.find).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(`products:tags:${tags.sort().join(',')}`, products);
    });
  });

  describe('findByMerchant', () => {
    it('should return products from cache when available', async () => {
      const merchantId = 'merchant-123';
      const products = [mockProduct];
      
      // Mock cache hit
      mockCacheManager.get.mockResolvedValue(products);
      
      const result = await service.findByMerchant(merchantId);

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith(`products:merchant:${merchantId}`);
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it('should fetch products from database and store in cache when cache misses', async () => {
      const merchantId = 'merchant-123';
      const products = [mockProduct];
      
      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);
      jest.spyOn(productModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(products),
      } as any);
      
      const result = await service.findByMerchant(merchantId);

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith(`products:merchant:${merchantId}`);
      expect(productModel.find).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(`products:merchant:${merchantId}`, products);
    });
  });
});
