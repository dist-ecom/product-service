import { Types } from 'mongoose';
import { CreateProductDto } from '../src/products/dto/create-product.dto';
import { UpdateProductDto } from '../src/products/dto/update-product.dto';

export const generateMockProduct = (overrides: Partial<CreateProductDto> = {}): CreateProductDto => ({
  name: 'Test Product',
  description: 'Test Description',
  price: 99.99,
  category: 'Test Category',
  tags: ['test', 'mock'],
  ...overrides,
});

export const generateMockProductId = (): string => new Types.ObjectId().toString();

export const generateMockUpdateProduct = (overrides: Partial<UpdateProductDto> = {}): UpdateProductDto => ({
  name: 'Updated Product',
  description: 'Updated Description',
  price: 149.99,
  category: 'Updated Category',
  tags: ['updated', 'test'],
  ...overrides,
});

export const mockProductId = generateMockProductId();
export const mockAdminId = generateMockProductId();
export const mockUserId = generateMockProductId(); 