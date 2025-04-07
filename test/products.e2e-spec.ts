import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { mockAuthService } from './auth.mock';
import {
  generateMockProduct,
  generateMockProductId,
  generateMockUpdateProduct,
  mockProductId,
  mockAdminId,
  mockUserId,
} from './test.utils';
import { setupTestDatabase, teardownTestDatabase } from './test-db.setup';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let authToken: string;
  let userToken: string;
  let adminToken: string;
  let elasticsearchService: ElasticsearchService;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    // Set up test database and get module fixture
    const { moduleFixture: fixture, elasticsearchService: esService } = await setupTestDatabase();
    moduleFixture = fixture;
    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    elasticsearchService = esService;
    
    // Generate auth token
    authToken = jwtService.sign(
      { sub: 'test-user-id', email: 'test@example.com' },
      { secret: configService.get<string>('JWT_SECRET') }
    );
    
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Generate tokens for testing
    userToken = mockAuthService.generateUserToken(mockUserId);
    adminToken = mockAuthService.generateAdminToken(mockAdminId);
  });

  afterAll(async () => {
    await teardownTestDatabase(moduleFixture);
    await app.close();
  });

  describe('/products (POST)', () => {
    it('should create a product when authenticated as admin', () => {
      const createProductDto = generateMockProduct();

      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createProductDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe(createProductDto.name);
          expect(res.body.description).toBe(createProductDto.description);
          expect(res.body.price).toBe(createProductDto.price);
          expect(res.body.category).toBe(createProductDto.category);
          expect(res.body.tags).toEqual(createProductDto.tags);
        });
    });

    it('should return 401 when not authenticated', () => {
      const createProductDto = generateMockProduct();

      return request(app.getHttpServer())
        .post('/products')
        .send(createProductDto)
        .expect(401);
    });
  });

  describe('/products (GET)', () => {
    it('should return all products when authenticated', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(401);
    });
  });

  describe('/products/:id (GET)', () => {
    it('should return a product by id when authenticated', () => {
      return request(app.getHttpServer())
        .get(`/products/${mockProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('description');
          expect(res.body).toHaveProperty('price');
          expect(res.body).toHaveProperty('category');
          expect(res.body).toHaveProperty('tags');
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get(`/products/${mockProductId}`)
        .expect(401);
    });

    it('should return 404 when product not found', () => {
      return request(app.getHttpServer())
        .get(`/products/${generateMockProductId()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/products/:id (PATCH)', () => {
    it('should update a product when authenticated as admin', () => {
      const updateProductDto = generateMockUpdateProduct();

      return request(app.getHttpServer())
        .patch(`/products/${mockProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateProductDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe(updateProductDto.name);
          expect(res.body.description).toBe(updateProductDto.description);
          expect(res.body.price).toBe(updateProductDto.price);
          expect(res.body.category).toBe(updateProductDto.category);
          expect(res.body.tags).toEqual(updateProductDto.tags);
        });
    });

    it('should return 401 when not authenticated', () => {
      const updateProductDto = generateMockUpdateProduct();

      return request(app.getHttpServer())
        .patch(`/products/${mockProductId}`)
        .send(updateProductDto)
        .expect(401);
    });

    it('should return 404 when product not found', () => {
      const updateProductDto = generateMockUpdateProduct();

      return request(app.getHttpServer())
        .patch(`/products/${generateMockProductId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateProductDto)
        .expect(404);
    });
  });

  describe('/products/:id (DELETE)', () => {
    it('should delete a product when authenticated as admin', () => {
      return request(app.getHttpServer())
        .delete(`/products/${mockProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .delete(`/products/${mockProductId}`)
        .expect(401);
    });

    it('should return 404 when product not found', () => {
      return request(app.getHttpServer())
        .delete(`/products/${generateMockProductId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/products/search (GET)', () => {
    it('should search products when authenticated', () => {
      const query = 'test';

      return request(app.getHttpServer())
        .get(`/products/search?q=${query}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return 401 when not authenticated', () => {
      const query = 'test';

      return request(app.getHttpServer())
        .get(`/products/search?q=${query}`)
        .expect(401);
    });
  });

  describe('/products/category/:category (GET)', () => {
    it('should return products by category when authenticated', () => {
      const category = 'Test Category';

      return request(app.getHttpServer())
        .get(`/products/category/${category}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return 401 when not authenticated', () => {
      const category = 'Test Category';

      return request(app.getHttpServer())
        .get(`/products/category/${category}`)
        .expect(401);
    });
  });

  describe('/products/tags (GET)', () => {
    it('should return products by tags when authenticated', () => {
      const tags = ['test', 'mock'];

      return request(app.getHttpServer())
        .get(`/products/tags?tags=${tags.join(',')}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return 401 when not authenticated', () => {
      const tags = ['test', 'mock'];

      return request(app.getHttpServer())
        .get(`/products/tags?tags=${tags.join(',')}`)
        .expect(401);
    });
  });
}); 