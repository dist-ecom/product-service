# Search Implementation

## Overview

The Product Service implements full-text search capabilities using Elasticsearch. This document describes the search implementation, configuration, and best practices.

## Architecture

### Components

1. **MongoDB**: Primary database for product data
2. **Elasticsearch**: Search engine for full-text search
3. **NestJS Service**: Handles synchronization and search operations

### Data Flow

1. Product Creation/Update/Delete in MongoDB
2. Synchronization with Elasticsearch
3. Search requests handled by Elasticsearch
4. Results returned to the client

## Elasticsearch Configuration

### Index Setup

```typescript
// products.module.ts
@Module({
  imports: [
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    }),
  ],
})
```

### Index Mapping

```json
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "standard"
      },
      "description": {
        "type": "text",
        "analyzer": "standard"
      },
      "price": {
        "type": "float"
      },
      "category": {
        "type": "keyword"
      },
      "tags": {
        "type": "keyword"
      }
    }
  }
}
```

## Search Implementation

### Service Layer

```typescript
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async search(query: string) {
    const { hits } = await this.elasticsearchService.search<ElasticsearchProduct>({
      index: 'products',
      query: {
        multi_match: {
          query: query,
          fields: ['name', 'description', 'category', 'tags'],
        },
      },
    });

    return hits.hits
      .filter((hit) => hit._source)
      .map((hit) => ({
        _id: hit._id,
        name: hit._source!.name,
        description: hit._source!.description,
        price: hit._source!.price,
        category: hit._source!.category,
        tags: hit._source!.tags,
      }));
  }
}
```

### Data Synchronization

#### Create Operation
```typescript
async create(createProductDto: CreateProductDto): Promise<Product> {
  const createdProduct = new this.productModel(createProductDto);
  const savedProduct = await createdProduct.save();
  
  // Index in Elasticsearch
  await this.elasticsearchService.index({
    index: 'products',
    id: savedProduct._id.toString(),
    document: {
      name: savedProduct.name,
      description: savedProduct.description,
      price: savedProduct.price,
      category: savedProduct.category,
      tags: savedProduct.tags,
    },
  });

  return savedProduct;
}
```

#### Update Operation
```typescript
async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
  const updatedProduct = await this.productModel
    .findByIdAndUpdate(id, updateProductDto, { new: true })
    .exec();
  
  if (!updatedProduct) {
    throw new NotFoundException(`Product with ID ${id} not found`);
  }

  // Update in Elasticsearch
  await this.elasticsearchService.update({
    index: 'products',
    id: id,
    doc: {
      name: updatedProduct.name,
      description: updatedProduct.description,
      price: updatedProduct.price,
      category: updatedProduct.category,
      tags: updatedProduct.tags,
    },
  });

  return updatedProduct;
}
```

#### Delete Operation
```typescript
async remove(id: string): Promise<void> {
  const result = await this.productModel.findByIdAndDelete(id).exec();
  if (!result) {
    throw new NotFoundException(`Product with ID ${id} not found`);
  }

  // Remove from Elasticsearch
  await this.elasticsearchService.delete({
    index: 'products',
    id: id,
  });
}
```

## Search Features

### Full-Text Search

The service implements full-text search across multiple fields:
- Product name
- Product description
- Category
- Tags

### Search Query Example

```typescript
// Example search query
const searchQuery = {
  index: 'products',
  query: {
    multi_match: {
      query: 'search term',
      fields: ['name^3', 'description^2', 'category', 'tags'],
      fuzziness: 'AUTO',
    },
  },
  sort: [
    { _score: 'desc' },
    { price: 'asc' }
  ],
  from: 0,
  size: 10
};
```

### Search Results

```typescript
interface SearchResult {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  _score?: number;
}
```

## Best Practices

### 1. Index Management

- Create indices with appropriate mappings before use
- Implement index aliases for zero-downtime reindexing
- Regular index maintenance and optimization

### 2. Search Optimization

- Use appropriate analyzers for different field types
- Implement field boosting for better relevance
- Use filters for exact matches
- Implement pagination for large result sets

### 3. Performance

- Use bulk operations for data synchronization
- Implement proper error handling
- Monitor search performance
- Use appropriate timeout settings

### 4. Data Consistency

- Implement retry mechanisms for failed operations
- Use transactions where appropriate
- Maintain proper error logging
- Implement data validation

## Error Handling

```typescript
try {
  const result = await this.elasticsearchService.search(searchQuery);
  return result;
} catch (error) {
  if (error instanceof ElasticsearchError) {
    // Handle Elasticsearch specific errors
    throw new InternalServerErrorException('Search service error');
  }
  throw error;
}
```

## Monitoring

### Key Metrics to Monitor

1. Search Response Time
2. Index Size
3. Query Performance
4. Error Rates
5. Synchronization Status

### Health Checks

```typescript
async checkHealth() {
  try {
    const health = await this.elasticsearchService.cluster.health();
    return {
      status: health.status,
      numberOfNodes: health.number_of_nodes,
      activeShards: health.active_shards,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
}
``` 