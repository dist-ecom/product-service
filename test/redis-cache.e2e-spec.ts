import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProductsService } from '../src/products/products.service';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../src/products/schemas/product.schema';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

describe('Redis Caching (e2e)', () => {
  let app: INestApplication;
  let productsService: ProductsService;
  let productModel: Model<ProductDocument>;
  let jwtService: JwtService;
  let adminToken: string;
  let testProductId: string;

  const testProduct = {
    name: 'Test Cache Product',
    description: 'This is a test product for cache testing',
    price: 99.99,
    category: 'Testing',
    tags: ['test', 'cache', 'redis'],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    productsService = moduleFixture.get<ProductsService>(ProductsService);
    productModel = moduleFixture.get<Model<ProductDocument>>(getModelToken(Product.name));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generate admin token for testing
    adminToken = jwtService.sign(
      {
        userId: 'admin-user',
        role: 'ADMIN',
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION_TIME,
      },
    );

    await app.init();

    // Clear any existing test products
    await productModel.deleteMany({ category: 'Testing' }).exec();

    // Create a test product
    const createdProduct = await productsService.create(testProduct, 'admin-user', 'ADMIN');
    testProductId = createdProduct._id.toString();
  });

  afterAll(async () => {
    // Clean up
    await productModel.deleteMany({ category: 'Testing' }).exec();
    await app.close();
  });

  describe('GET /products', () => {
    it('should cache products list after first request', async () => {
      // First request - should be a cache miss
      const startTime = Date.now();
      await request(app.getHttpServer()).get('/products').expect(200);
      const firstRequestTime = Date.now() - startTime;

      // Second request - should be a cache hit and faster
      const startTime2 = Date.now();
      await request(app.getHttpServer()).get('/products').expect(200);
      const secondRequestTime = Date.now() - startTime2;

      // The second request should be significantly faster
      console.log(`First request: ${firstRequestTime}ms, Second request: ${secondRequestTime}ms`);
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
    });
  });

  describe('GET /products/:id', () => {
    it('should cache individual product after first request', async () => {
      // First request - should be a cache miss
      const startTime = Date.now();
      await request(app.getHttpServer()).get(`/products/${testProductId}`).expect(200);
      const firstRequestTime = Date.now() - startTime;

      // Second request - should be a cache hit and faster
      const startTime2 = Date.now();
      await request(app.getHttpServer()).get(`/products/${testProductId}`).expect(200);
      const secondRequestTime = Date.now() - startTime2;

      // The second request should be significantly faster
      console.log(`First request: ${firstRequestTime}ms, Second request: ${secondRequestTime}ms`);
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
    });
  });

  describe('POST /products', () => {
    it('should invalidate cache when creating a new product', async () => {
      // Make initial request to ensure products are cached
      await request(app.getHttpServer()).get('/products').expect(200);

      // Create a new product which should invalidate the cache
      const newProduct = {
        name: 'Cache Invalidation Test',
        description: 'Testing cache invalidation',
        price: 49.99,
        category: 'Testing',
        tags: ['test', 'cache', 'invalidation'],
      };

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct)
        .expect(201);

      // Make another request to get products
      // Should be a cache miss (slower) since cache was invalidated
      const startTime = Date.now();
      await request(app.getHttpServer()).get('/products').expect(200);
      const firstRequestTime = Date.now() - startTime;

      // Second request should be faster (cache hit)
      const startTime2 = Date.now();
      await request(app.getHttpServer()).get('/products').expect(200);
      const secondRequestTime = Date.now() - startTime2;

      console.log(
        `After invalidation - First: ${firstRequestTime}ms, Second: ${secondRequestTime}ms`,
      );
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
    });
  });

  describe('Filtered queries', () => {
    it('should cache category-specific product lists', async () => {
      const category = 'Testing';

      // First request - should be a cache miss
      const startTime = Date.now();
      await request(app.getHttpServer()).get(`/products/category/${category}`).expect(200);
      const firstRequestTime = Date.now() - startTime;

      // Second request - should be a cache hit and faster
      const startTime2 = Date.now();
      await request(app.getHttpServer()).get(`/products/category/${category}`).expect(200);
      const secondRequestTime = Date.now() - startTime2;

      console.log(`Category query - First: ${firstRequestTime}ms, Second: ${secondRequestTime}ms`);
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
    });
  });
});
