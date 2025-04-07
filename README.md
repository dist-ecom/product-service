# Product Service

## Overview
The Product Service is a core component of the ecommerce platform, providing product management, search functionality, and inventory tracking. It's built using NestJS and follows RESTful API principles.

## Features
- Product management (CRUD operations)
- Full-text search using Elasticsearch
- Category-based product organization
- Tag-based product filtering
- Stock management
- Role-based access control
- API documentation with Swagger

## Tech Stack
- NestJS - Progressive Node.js framework
- MongoDB - Primary database
- Mongoose - ODM for MongoDB
- Elasticsearch - Search engine
- JWT - Token-based authentication
- Swagger - API documentation

## Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB
- Elasticsearch

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd product-service

# Install dependencies
npm install
```

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/product_service

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1d

# App
PORT=3000
NODE_ENV=development
```

## Running the App

```bash
# Development
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

The API is documented using Swagger. Once the application is running, you can access the Swagger UI at:

```
http://localhost:3000/api
```

### Products

#### Create Product
- **Endpoint**: POST /products
- **Description**: Create a new product
- **Authentication**: JWT Bearer token required
- **Authorization**: Admin role required
- **Request Body**: CreateProductDto
  - name: Product name
  - description: Product description
  - price: Product price
  - category: Product category
  - tags: Optional array of tags
  - images: Optional array of image URLs
  - isActive: Optional boolean
  - stock: Optional number
  - metadata: Optional object

#### Get All Products
- **Endpoint**: GET /products
- **Description**: Get a list of all products
- **Authentication**: JWT Bearer token required

#### Search Products
- **Endpoint**: GET /products/search
- **Description**: Search products using full-text search
- **Authentication**: JWT Bearer token required
- **Query Parameters**:
  - q: Search query string

#### Get Products by Category
- **Endpoint**: GET /products/category/:category
- **Description**: Get products in a specific category
- **Authentication**: JWT Bearer token required

#### Get Product by ID
- **Endpoint**: GET /products/:id
- **Description**: Get a specific product by ID
- **Authentication**: JWT Bearer token required

#### Update Product
- **Endpoint**: PATCH /products/:id
- **Description**: Update a product's information
- **Authentication**: JWT Bearer token required
- **Authorization**: Admin role required
- **Request Body**: UpdateProductDto (partial CreateProductDto)

#### Delete Product
- **Endpoint**: DELETE /products/:id
- **Description**: Delete a product
- **Authentication**: JWT Bearer token required
- **Authorization**: Admin role required

## Database Schema

### Product Entity
- _id: ObjectId (Primary Key)
- name: String
- description: String
- price: Number
- category: String
- tags: String[]
- images: String[]
- isActive: Boolean
- stock: Number
- metadata: Object
- createdAt: DateTime
- updatedAt: DateTime

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Response Formats

### Success Response
```json
{
  "statusCode": 200,
  "data": {...}
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type"
}
```

## Additional Documentation

For more detailed documentation, please refer to the [docs](./docs) directory:
- [API Reference](./docs/api-reference.md)
- [Database Schema](./docs/database-schema.md)
- [Search Implementation](./docs/search.md)
- [Deployment Guide](./docs/deployment.md)
