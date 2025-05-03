import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { RedisService } from '../cache/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async check() {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'unknown',
        elasticsearch: 'unknown',
        redis: 'unknown',
      },
    };

    try {
      // Check MongoDB
      if (this.mongoConnection.readyState === 1) {
        healthStatus.services.mongodb = 'up';
      } else {
        healthStatus.services.mongodb = 'down';
        healthStatus.status = 'error';
      }
    } catch (error) {
      healthStatus.services.mongodb = 'down';
      healthStatus.status = 'error';
    }

    try {
      // Check Elasticsearch
      const esHealth = await this.elasticsearchService.cluster.health();
      if (esHealth.status !== 'red') {
        healthStatus.services.elasticsearch = 'up';
      } else {
        healthStatus.services.elasticsearch = 'degraded';
        if (healthStatus.status !== 'error') {
          healthStatus.status = 'degraded';
        }
      }
    } catch (error) {
      healthStatus.services.elasticsearch = 'down';
      healthStatus.status = 'error';
    }

    try {
      // Check Redis
      const redisClient = this.redisService.getClient();
      if (redisClient.status === 'ready') {
        healthStatus.services.redis = 'up';
      } else {
        healthStatus.services.redis = 'down';
        healthStatus.status = 'error';
      }
    } catch (error) {
      healthStatus.services.redis = 'down';
      healthStatus.status = 'error';
    }

    return healthStatus;
  }
} 