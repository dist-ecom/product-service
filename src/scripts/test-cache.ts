import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProductsService } from '../products/products.service';
import { Logger } from '@nestjs/common';

async function testCache() {
  const logger = new Logger('CacheTest');
  logger.log('Starting cache test');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const productsService = app.get(ProductsService);
  
  // First call - should be cache miss
  logger.log('First fetch - should be a cache miss');
  console.time('First request');
  const products1 = await productsService.findAll();
  console.timeEnd('First request');
  logger.log(`Retrieved ${products1.length} products`);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Second call - should be cache hit
  logger.log('Second fetch - should be a cache hit');
  console.time('Second request');
  const products2 = await productsService.findAll();
  console.timeEnd('Second request');
  logger.log(`Retrieved ${products2.length} products`);
  
  // If you have a specific product ID, test that too
  if (products1.length > 0) {
    const testId = products1[0]._id.toString();
    
    // First call - should be cache miss
    logger.log(`First fetch of product ${testId} - should be a cache miss`);
    console.time('First product request');
    await productsService.findOne(testId);
    console.timeEnd('First product request');
    
    // Second call - should be cache hit
    logger.log(`Second fetch of product ${testId} - should be a cache hit`);
    console.time('Second product request');
    await productsService.findOne(testId);
    console.timeEnd('Second product request');
  }
  
  await app.close();
  logger.log('Cache test completed');
}

testCache().catch(err => {
  console.error('Error running cache test', err);
  process.exit(1);
}); 