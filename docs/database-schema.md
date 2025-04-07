# Database Schema

## Overview

The Product Service uses MongoDB as its primary database, with Mongoose as the Object Document Mapper (ODM). The service also integrates with Elasticsearch for full-text search capabilities.

## Collections

### Products

The main collection storing product information.

#### Schema Definition
```typescript
@Schema({ timestamps: true })
export class Product {
  @ApiProperty({ description: 'The unique identifier of the product' })
  _id: string;

  @ApiProperty({ description: 'The name of the product' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'The description of the product' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'The price of the product' })
  @Prop({ required: true })
  price: number;

  @ApiProperty({ description: 'The category of the product' })
  @Prop({ required: true })
  category: string;

  @ApiPropertyOptional({ description: 'Tags associated with the product' })
  @Prop([String])
  tags: string[];

  @ApiPropertyOptional({ description: 'URLs of product images' })
  @Prop([String])
  images: string[];

  @ApiProperty({ description: 'Whether the product is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Current stock level' })
  @Prop({ default: 0 })
  stock: number;

  @ApiPropertyOptional({ description: 'Additional product metadata' })
  @Prop({ type: Object })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Yes | Unique identifier |
| name | String | Yes | Product name |
| description | String | Yes | Product description |
| price | Number | Yes | Product price |
| category | String | Yes | Product category |
| tags | String[] | No | Array of product tags |
| images | String[] | No | Array of image URLs |
| isActive | Boolean | No | Product availability status |
| stock | Number | No | Current stock level |
| metadata | Object | No | Additional product information |
| createdAt | Date | Yes | Creation timestamp |
| updatedAt | Date | Yes | Last update timestamp |

#### Indexes

The following indexes are created for optimal query performance:

1. Category Index
```javascript
{
  category: 1
}
```

2. Tags Index
```javascript
{
  tags: 1
}
```

3. Text Search Index
```javascript
{
  name: "text",
  description: "text",
  category: "text",
  tags: "text"
}
```

## Elasticsearch Integration

### Product Index

The service maintains a synchronized Elasticsearch index for full-text search capabilities.

#### Mapping
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

#### Synchronization

The service maintains data consistency between MongoDB and Elasticsearch through:

1. Create Operations: Products are indexed in Elasticsearch upon creation
2. Update Operations: Elasticsearch documents are updated when products are modified
3. Delete Operations: Elasticsearch documents are removed when products are deleted

## Data Validation

### CreateProductDto
```typescript
export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
```

## Best Practices

1. **Data Consistency**
   - Use transactions for operations that affect multiple documents
   - Implement proper error handling for failed operations
   - Maintain data consistency between MongoDB and Elasticsearch

2. **Performance**
   - Use appropriate indexes for frequently queried fields
   - Implement pagination for large result sets
   - Use projection to limit returned fields when possible

3. **Security**
   - Validate all input data
   - Implement proper access control
   - Sanitize data before storage

4. **Maintenance**
   - Regular backup of MongoDB data
   - Monitor index performance
   - Implement proper logging for debugging 