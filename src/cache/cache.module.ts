import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { RedisService } from './redis.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: configService.get('REDIS_TTL', 3600),
        retry_strategy: function (options) {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis connection refused. Please check if Redis server is running.');
          }
          return Math.min(options.attempt * 100, 3000);
        },
        name: 'product-service-cache',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [NestCacheModule, RedisService],
})
export class CacheModule {}
