import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from '../../src/products/schemas/product.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let productModel: Model<Product>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockProduct = {
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    category: 'Test Category',
    tags: ['test', 'product'],
  };

  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    productModel = moduleFixture.get<Model<Product>>(getModelToken(Product.name));
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    await app.init();

    // Generate tokens for testing
    adminToken = jwtService.sign(
      { sub: 'admin-id', username: 'admin', roles: ['admin'] },
      { secret: configService.get<string>('JWT_SECRET') },
    );

    userToken = jwtService.sign(
      { sub: 'user-id', username: 'user', roles: ['user'] },
      { secret: configService.get<string>('JWT_SECRET') },
    );
  });

  beforeEach(async () => {
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /products', () => {
    it('should create a product when admin token is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockProduct)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(mockProduct.name);
      expect(response.body.description).toBe(mockProduct.description);
      expect(response.body.price).toBe(mockProduct.price);
      expect(response.body.category).toBe(mockProduct.category);
      expect(response.body.tags).toEqual(mockProduct.tags);
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).post('/products').send(mockProduct).expect(401);
    });

    it('should return 403 when user token is provided', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(mockProduct)
        .expect(403);
    });

    it('should validate product data', async () => {
      const invalidProduct = {
        name: '',
        price: -100,
      };

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);
    });
  });

  describe('GET /products', () => {
    it('should return all products', async () => {
      await productModel.create(mockProduct);

      const response = await request(app.getHttpServer()).get('/products').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe(mockProduct.name);
    });

    it('should return empty array when no products exist', async () => {
      const response = await request(app.getHttpServer()).get('/products').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /products/:id', () => {
    it('should return a product by id', async () => {
      const product = await productModel.create(mockProduct);

      const response = await request(app.getHttpServer())
        .get(`/products/${product._id}`)
        .expect(200);

      expect(response.body._id).toBe(product._id.toString());
      expect(response.body.name).toBe(mockProduct.name);
    });

    it('should return 404 when product is not found', async () => {
      await request(app.getHttpServer()).get('/products/999999999999999999999999').expect(404);
    });

    it('should validate product id format', async () => {
      await request(app.getHttpServer()).get('/products/invalid-id').expect(400);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update a product when admin token is provided', async () => {
      const product = await productModel.create(mockProduct);
      const updateData = { name: 'Updated Product' };

      const response = await request(app.getHttpServer())
        .patch(`/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(mockProduct.description);
    });

    it('should return 401 when no token is provided', async () => {
      const product = await productModel.create(mockProduct);
      await request(app.getHttpServer())
        .patch(`/products/${product._id}`)
        .send({ name: 'Updated Product' })
        .expect(401);
    });

    it('should return 403 when user token is provided', async () => {
      const product = await productModel.create(mockProduct);
      await request(app.getHttpServer())
        .patch(`/products/${product._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Product' })
        .expect(403);
    });

    it('should validate update data', async () => {
      const product = await productModel.create(mockProduct);
      const invalidUpdate = { price: -100 };

      await request(app.getHttpServer())
        .patch(`/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdate)
        .expect(400);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete a product when admin token is provided', async () => {
      const product = await productModel.create(mockProduct);

      await request(app.getHttpServer())
        .delete(`/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedProduct = await productModel.findById(product._id);
      expect(deletedProduct).toBeNull();
    });

    it('should return 401 when no token is provided', async () => {
      const product = await productModel.create(mockProduct);
      await request(app.getHttpServer()).delete(`/products/${product._id}`).expect(401);
    });

    it('should return 403 when user token is provided', async () => {
      const product = await productModel.create(mockProduct);
      await request(app.getHttpServer())
        .delete(`/products/${product._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /products/search', () => {
    it('should search products', async () => {
      await productModel.create(mockProduct);

      const response = await request(app.getHttpServer())
        .get('/products/search?q=test')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe(mockProduct.name);
    });

    it('should return empty array when no matches found', async () => {
      await productModel.create(mockProduct);

      const response = await request(app.getHttpServer())
        .get('/products/search?q=nonexistent')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /products/category/:category', () => {
    it('should return products by category', async () => {
      await productModel.create(mockProduct);

      const response = await request(app.getHttpServer())
        .get(`/products/category/${mockProduct.category}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].category).toBe(mockProduct.category);
    });

    it('should return empty array when category not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/category/nonexistent')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /products/tags', () => {
    it('should return products by tags', async () => {
      await productModel.create(mockProduct);

      const response = await request(app.getHttpServer())
        .get(`/products/tags?tags=${mockProduct.tags[0]}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].tags).toContain(mockProduct.tags[0]);
    });

    it('should return empty array when tag not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/tags?tags=nonexistent')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should handle multiple tags', async () => {
      await productModel.create(mockProduct);

      const response = await request(app.getHttpServer())
        .get(`/products/tags?tags=${mockProduct.tags[0]}&tags=${mockProduct.tags[1]}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].tags).toEqual(expect.arrayContaining(mockProduct.tags));
    });
  });
});
