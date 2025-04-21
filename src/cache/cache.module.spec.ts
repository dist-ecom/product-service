import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheModule } from './cache.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';

describe('RedisCacheModule', () => {
  let module: TestingModule;
  let cacheManager: Cache;
  let configService: ConfigService;

  beforeEach(async () => {
    // Create the test module with the RedisCacheModule
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          // Mock environment variables for testing
          load: [
            () => ({
              REDIS_HOST: 'localhost',
              REDIS_PORT: 6379,
              REDIS_TTL: 3600,
            }),
          ],
        }),
        RedisCacheModule,
      ],
    }).compile();

    cacheManager = module.get<Cache>(CACHE_MANAGER);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(cacheManager).toBeDefined();
  });

  it('should have the correct Redis configuration', () => {
    // Verify the config service is returning the expected values
    expect(configService.get('REDIS_HOST')).toBe('localhost');
    expect(configService.get('REDIS_PORT')).toBe(6379);
    expect(configService.get('REDIS_TTL')).toBe(3600);
  });

  // These tests would require an actual Redis instance running
  // We're skipping them for now, but they could be useful for integration testing
  describe('Cache operations (integration)', () => {
    it.skip('should store and retrieve values', async () => {
      const testKey = 'test:key';
      const testValue = { test: 'value' };

      await cacheManager.set(testKey, testValue);
      const retrieved = await cacheManager.get(testKey);

      expect(retrieved).toEqual(testValue);
    });

    it.skip('should respect TTL settings', async () => {
      const testKey = 'test:ttl';
      const testValue = { test: 'ttl-value' };

      // Set with a very short TTL (100ms)
      await cacheManager.set(testKey, testValue, 100);

      // Value should be available immediately
      let retrieved = await cacheManager.get(testKey);
      expect(retrieved).toEqual(testValue);

      // Wait for the TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Value should be gone
      retrieved = await cacheManager.get(testKey);
      expect(retrieved).toBeUndefined();
    });

    it.skip('should delete keys', async () => {
      const testKey = 'test:delete';
      const testValue = { test: 'delete-me' };

      await cacheManager.set(testKey, testValue);

      // Confirm it was stored
      let retrieved = await cacheManager.get(testKey);
      expect(retrieved).toEqual(testValue);

      // Delete it
      await cacheManager.del(testKey);

      // Should be gone
      retrieved = await cacheManager.get(testKey);
      expect(retrieved).toBeUndefined();
    });
  });
});
