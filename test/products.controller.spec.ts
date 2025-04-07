import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '../src/products/products.controller';
import { ProductsService } from '../src/products/products.service';
import { CreateProductDto } from '../src/products/dto/create-product.dto';
import { UpdateProductDto } from '../src/products/dto/update-product.dto';
import { mockAuthService } from './auth.mock';
import {
  generateMockProduct,
  generateMockProductId,
  generateMockUpdateProduct,
  mockProductId,
  mockAdminId,
  mockUserId,
} from './test.utils';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    search: jest.fn(),
    findByCategory: jest.fn(),
    findByTags: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createProductDto = generateMockProduct();
      const expectedProduct = { _id: mockProductId, ...createProductDto };

      mockProductsService.create.mockResolvedValue(expectedProduct);

      const result = await controller.create(createProductDto);

      expect(result).toEqual(expectedProduct);
      expect(mockProductsService.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const expectedProducts = [
        { _id: generateMockProductId(), ...generateMockProduct() },
        { _id: generateMockProductId(), ...generateMockProduct() },
      ];

      mockProductsService.findAll.mockResolvedValue(expectedProducts);

      const result = await controller.findAll();

      expect(result).toEqual(expectedProducts);
      expect(mockProductsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const expectedProduct = { _id: mockProductId, ...generateMockProduct() };

      mockProductsService.findOne.mockResolvedValue(expectedProduct);

      const result = await controller.findOne(mockProductId);

      expect(result).toEqual(expectedProduct);
      expect(mockProductsService.findOne).toHaveBeenCalledWith(mockProductId);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto = generateMockUpdateProduct();
      const expectedProduct = { _id: mockProductId, ...updateProductDto };

      mockProductsService.update.mockResolvedValue(expectedProduct);

      const result = await controller.update(mockProductId, updateProductDto);

      expect(result).toEqual(expectedProduct);
      expect(mockProductsService.update).toHaveBeenCalledWith(mockProductId, updateProductDto);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      mockProductsService.remove.mockResolvedValue(undefined);

      await controller.remove(mockProductId);

      expect(mockProductsService.remove).toHaveBeenCalledWith(mockProductId);
    });
  });

  describe('search', () => {
    it('should search products', async () => {
      const query = 'test';
      const expectedProducts = [
        { _id: mockProductId, ...generateMockProduct() },
      ];

      mockProductsService.search.mockResolvedValue(expectedProducts);

      const result = await controller.search(query);

      expect(result).toEqual(expectedProducts);
      expect(mockProductsService.search).toHaveBeenCalledWith(query);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      const category = 'Test Category';
      const expectedProducts = [
        { _id: generateMockProductId(), ...generateMockProduct({ category }) },
        { _id: generateMockProductId(), ...generateMockProduct({ category }) },
      ];

      mockProductsService.findByCategory.mockResolvedValue(expectedProducts);

      const result = await controller.findByCategory(category);

      expect(result).toEqual(expectedProducts);
      expect(mockProductsService.findByCategory).toHaveBeenCalledWith(category);
    });
  });

  describe('findByTags', () => {
    it('should return products by tags', async () => {
      const tags = ['test', 'mock'];
      const expectedProducts = [
        { _id: generateMockProductId(), ...generateMockProduct({ tags }) },
        { _id: generateMockProductId(), ...generateMockProduct({ tags }) },
      ];

      mockProductsService.findByTags.mockResolvedValue(expectedProducts);

      const result = await controller.findByTags(tags);

      expect(result).toEqual(expectedProducts);
      expect(mockProductsService.findByTags).toHaveBeenCalledWith(tags);
    });
  });
}); 