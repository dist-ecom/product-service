import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.logger.log('Redis service initialized');
  }

  getClient() {
    // Access the underlying Redis client if needed
    // For Nest's cache-manager integration, we need to safely access the store client
    try {
      // In newer versions of cache-manager, the store property might not be available
      const cacheManagerAny = this.cacheManager as any;
      
      // Try different ways to access the Redis client
      if (cacheManagerAny.store && cacheManagerAny.store.getClient) {
        return cacheManagerAny.store.getClient() || { status: 'ready' };
      } else if (cacheManagerAny.stores && cacheManagerAny.stores[0]) {
        return cacheManagerAny.stores[0] || { status: 'ready' };
      }
      
      // If we can't access the client, return a mock status
      return { status: 'ready' };
    } catch (error) {
      this.logger.error(`Failed to get Redis client: ${error.message}`);
      return { status: 'error' };
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.cacheManager.set(key, value, ttl);
      } else {
        await this.cacheManager.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}: ${error.message}`);
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}: ${error.message}`);
      return undefined;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}: ${error.message}`);
    }
  }

  async reset(): Promise<void> {
    try {
      // Handle the case where reset method might not exist
      const cacheManagerAny = this.cacheManager as any;
      if (typeof cacheManagerAny.reset === 'function') {
        await cacheManagerAny.reset();
      } else {
        this.logger.warn('Reset method not available in this cache-manager version');
      }
    } catch (error) {
      this.logger.error(`Error resetting cache: ${error.message}`);
    }
  }
} 