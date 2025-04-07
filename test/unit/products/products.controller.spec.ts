import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '../../../src/products/products.controller';
import { ProductsService } from '../../../src/products/products.service';
import { CreateProductDto } from '../../../src/products/dto/create-product.dto';
import { UpdateProductDto } from '../../../src/products/dto/update-product.dto';
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
    create: jest.fn().mockResolvedValue(mockProduct),
    findAll: jest.fn().mockResolvedValue([mockProduct]),
    findOne: jest.fn().mockResolvedValue(mockProduct),
    update: jest.fn().mockResolvedValue(mockProduct),
    remove: jest.fn().mockResolvedValue(mockProduct),
    search: jest.fn().mockResolvedValue([mockProduct]),
    findByCategory: jest.fn().mockResolvedValue([mockProduct]),
    findByTags: jest.fn().mockResolvedValue([mockProduct]),
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

      const result = await controller.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(service.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const result = await controller.findAll();

      expect(result).toEqual([mockProduct]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const result = await controller.findOne('1');

      expect(result).toEqual(mockProduct);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when product is not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValueOnce(new NotFoundException());

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      const result = await controller.update('1', updateProductDto);

      expect(result).toEqual(mockProduct);
      expect(service.update).toHaveBeenCalledWith('1', updateProductDto);
    });

    it('should throw NotFoundException when product is not found', async () => {
      jest.spyOn(service, 'update').mockRejectedValueOnce(new NotFoundException());

      await expect(controller.update('999', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const result = await controller.remove('1');

      expect(result).toEqual(mockProduct);
      expect(service.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when product is not found', async () => {
      jest.spyOn(service, 'remove').mockRejectedValueOnce(new NotFoundException());

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search products', async () => {
      const query = 'test';

      const result = await controller.search(query);

      expect(result).toEqual([mockProduct]);
      expect(service.search).toHaveBeenCalledWith(query);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      const category = 'Test Category';

      const result = await controller.findByCategory(category);

      expect(result).toEqual([mockProduct]);
      expect(service.findByCategory).toHaveBeenCalledWith(category);
    });
  });

  describe('findByTags', () => {
    it('should return products by tags', async () => {
      const tags = ['test', 'product'];

      const result = await controller.findByTags(tags);

      expect(result).toEqual([mockProduct]);
      expect(service.findByTags).toHaveBeenCalledWith(tags);
    });
  });
}); 