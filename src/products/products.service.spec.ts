import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let productModel: Model<ProductDocument>;
  let elasticsearchService: ElasticsearchService;

  const mockProduct = {
    _id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    category: 'Test Category',
    tags: ['test', 'product'],
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
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productModel = module.get<Model<ProductDocument>>(getModelToken(Product.name));
    elasticsearchService = module.get<ElasticsearchService>(ElasticsearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product and index it in Elasticsearch', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Test Category',
        tags: ['test', 'product'],
      };

      const result = await service.create(createProductDto);

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
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const products = [mockProduct];
      jest.spyOn(productModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(products),
      } as any);

      const result = await service.findAll();

      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      } as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product is not found', async () => {
      jest.spyOn(productModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product and update Elasticsearch index', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      const updatedProduct = { ...mockProduct, ...updateProductDto };
      jest.spyOn(productModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProduct),
      } as any);

      const result = await service.update('1', updateProductDto);

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
        },
      });
    });

    it('should throw NotFoundException when product is not found', async () => {
      jest.spyOn(productModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.update('999', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a product and delete from Elasticsearch', async () => {
      jest.spyOn(productModel, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      } as any);

      await service.remove('1');

      expect(elasticsearchService.delete).toHaveBeenCalledWith({
        index: 'products',
        id: '1',
      });
    });

    it('should throw NotFoundException when product is not found', async () => {
      jest.spyOn(productModel, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search products in Elasticsearch', async () => {
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

      mockElasticsearchService.search.mockResolvedValue(searchResults);

      const result = await service.search(query);

      expect(result).toEqual([mockProduct]);
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'products',
        query: {
          multi_match: {
            query: query,
            fields: ['name', 'description', 'category', 'tags'],
          },
        },
      });
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      const category = 'Test Category';
      const products = [mockProduct];
      jest.spyOn(productModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(products),
      } as any);

      const result = await service.findByCategory(category);

      expect(result).toEqual(products);
    });
  });

  describe('findByTags', () => {
    it('should return products by tags', async () => {
      const tags = ['test', 'product'];
      const products = [mockProduct];
      jest.spyOn(productModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(products),
      } as any);

      const result = await service.findByTags(tags);

      expect(result).toEqual(products);
    });
  });
});
