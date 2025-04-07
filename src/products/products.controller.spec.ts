import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotFoundException } from '@nestjs/common';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProduct = {
    _id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    category: 'Test Category',
    tags: ['test', 'product'],
  };

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
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Test Category',
        tags: ['test', 'product'],
      };

      mockProductsService.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(service.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const products = [mockProduct];
      mockProductsService.findAll.mockResolvedValue(products);

      const result = await controller.findAll();

      expect(result).toEqual(products);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockProduct);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when product is not found', async () => {
      mockProductsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      const updatedProduct = { ...mockProduct, ...updateProductDto };
      mockProductsService.update.mockResolvedValue(updatedProduct);

      const result = await controller.update('1', updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(service.update).toHaveBeenCalledWith('1', updateProductDto);
    });

    it('should throw NotFoundException when product is not found', async () => {
      mockProductsService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update('999', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      mockProductsService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when product is not found', async () => {
      mockProductsService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search products', async () => {
      const query = 'test';
      const searchResults = [mockProduct];
      mockProductsService.search.mockResolvedValue(searchResults);

      const result = await controller.search(query);

      expect(result).toEqual(searchResults);
      expect(service.search).toHaveBeenCalledWith(query);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      const category = 'Test Category';
      const products = [mockProduct];
      mockProductsService.findByCategory.mockResolvedValue(products);

      const result = await controller.findByCategory(category);

      expect(result).toEqual(products);
      expect(service.findByCategory).toHaveBeenCalledWith(category);
    });
  });

  describe('findByTags', () => {
    it('should return products by tags', async () => {
      const tags = ['test', 'product'];
      const products = [mockProduct];
      mockProductsService.findByTags.mockResolvedValue(products);

      const result = await controller.findByTags(tags);

      expect(result).toEqual(products);
      expect(service.findByTags).toHaveBeenCalledWith(tags);
    });
  });
}); 