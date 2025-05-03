import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    MongooseModule,
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    }),
    CacheModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {} 