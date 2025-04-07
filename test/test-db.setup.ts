import { Model } from 'mongoose';
import { Product } from '../src/products/schemas/product.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { mockProductId, generateMockProduct } from './test.utils';
import { TestJwtStrategy } from './jwt.strategy.test';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

export async function setupTestDatabase() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      MongooseModule.forRootAsync({
        useFactory: (configService: ConfigService) => ({
          uri: configService.get<string>('MONGODB_URI'),
        }),
        inject: [ConfigService],
      }),
      AppModule,
      JwtModule.registerAsync({
        useFactory: (configService: ConfigService) => ({
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '1h' },
        }),
        inject: [ConfigService],
      }),
    ],
    providers: [
      TestJwtStrategy,
      {
        provide: ElasticsearchService,
        useValue: {
          index: jest.fn(),
          search: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      },
    ],
  }).compile();

  const productModel = moduleFixture.get<Model<Product>>(getModelToken(Product.name));
  const elasticsearchService = moduleFixture.get<ElasticsearchService>(ElasticsearchService);

  // Clear existing data
  await productModel.deleteMany({});
  await elasticsearchService.delete({ index: 'products', id: mockProductId }).catch(() => {});

  // Create test product
  const testProduct = new productModel({
    _id: mockProductId,
    ...generateMockProduct(),
  });
  await testProduct.save();

  // Index in Elasticsearch
  const productDoc = { ...testProduct.toObject() };
  const { _id, ...documentWithoutId } = productDoc;
  await elasticsearchService.index({
    index: 'products',
    id: mockProductId,
    document: documentWithoutId,
  });

  return {
    productModel,
    elasticsearchService,
    moduleFixture,
  };
}

export async function teardownTestDatabase(moduleFixture: TestingModule) {
  if (!moduleFixture) return;

  const productModel = moduleFixture.get<Model<Product>>(getModelToken(Product.name));
  const elasticsearchService = moduleFixture.get<ElasticsearchService>(ElasticsearchService);

  // Clean up
  await productModel.deleteMany({});
  await elasticsearchService.delete({ index: 'products', id: mockProductId }).catch(() => {});
  await moduleFixture.close();
}
