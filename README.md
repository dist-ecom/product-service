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

### Authentication Endpoints

#### Auth Test
- **Endpoint**: GET /products/auth-test
- **Description**: Test endpoint to verify authentication
- **Authentication**: JWT Bearer token required
- **Response**: Status 200 if authentication is working, 401 if unauthorized

#### Verification Test
- **Endpoint**: GET /products/verification-test
- **Description**: Test endpoint to check merchant verification status
- **Authentication**: JWT Bearer token required
- **Response**: Status 200 with verification status, 401 if unauthorized

#### Token Debug
- **Endpoint**: GET /products/token-debug
- **Description**: Debug endpoint to test token parsing
- **Authentication**: Not required
- **Response**: Status 200 with token parsing result

#### Role Debug
- **Endpoint**: GET /products/role-debug
- **Description**: Debug endpoint to view user role information
- **Authentication**: JWT Bearer token required
- **Response**: Status 200 with user role information, 401 if unauthorized

### Product Endpoints

#### Create Product
- **Endpoint**: POST /products
- **Description**: Create a new product
- **Authentication**: JWT Bearer token required
- **Authorization**: Only verified merchants and admins can create products
- **Request Body**: CreateProductDto
  - name: Product name (required)
  - description: Product description (required)
  - price: Product price (required)
  - category: Product category (required)
  - tags: Optional array of tags
  - images: Optional array of image URLs
  - isActive: Optional boolean
  - stock: Optional number
  - metadata: Optional object
- **Response**: Status 201 with created product, 403 if forbidden

#### Get All Products
- **Endpoint**: GET /products
- **Description**: Get a list of all products
- **Authentication**: Not required
- **Response**: Status 200 with array of products

#### Search Products
- **Endpoint**: GET /products/search
- **Description**: Search products
- **Authentication**: Not required
- **Query Parameters**:
  - q: Search query string (required)
- **Response**: Status 200 with array of matching products

#### Get Products by Category
- **Endpoint**: GET /products/category/:category
- **Description**: Get products in a specific category
- **Authentication**: Not required
- **Path Parameters**:
  - category: Product category
- **Response**: Status 200 with array of products in the specified category

#### Get Products by Merchant
- **Endpoint**: GET /products/merchant/:merchantId
- **Description**: Get products by merchant
- **Authentication**: Not required
- **Path Parameters**:
  - merchantId: Merchant ID
- **Response**: Status 200 with array of products from the specified merchant

#### Get Products by Tags
- **Endpoint**: GET /products/tags
- **Description**: Get products by tags
- **Authentication**: Not required
- **Query Parameters**:
  - tags: Array of product tags
- **Response**: Status 200 with array of products with the specified tags

#### Get Product by ID
- **Endpoint**: GET /products/:id
- **Description**: Get a specific product by ID
- **Authentication**: Not required
- **Path Parameters**:
  - id: Product ID
- **Response**: Status 200 with product details, 404 if not found

#### Update Product
- **Endpoint**: PATCH /products/:id
- **Description**: Update a product's information
- **Authentication**: JWT Bearer token required
- **Authorization**: Only verified merchants and admins can update products
- **Path Parameters**:
  - id: Product ID
- **Request Body**: UpdateProductDto (partial CreateProductDto)
- **Response**: Status 200 with updated product, 403 if forbidden, 404 if not found

#### Delete Product
- **Endpoint**: DELETE /products/:id
- **Description**: Delete a product
- **Authentication**: JWT Bearer token required
- **Authorization**: Only verified merchants and admins can delete products
- **Path Parameters**:
  - id: Product ID
- **Response**: Status 200 with success message, 403 if forbidden, 404 if not found

## Database Schema

### Product Entity
- _id: ObjectId (Primary Key)
- name: String
- description: String
- price: Number
- category: String
- merchantId: String
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

### Success Response Format (Example)
```json
{
  "_id": "60f5f1d0f6d3f3c8a0f6d3f3",
  "name": "Wireless Bluetooth Headphones",
  "description": "High-quality wireless headphones with noise cancellation and 20-hour battery life",
  "price": 99.99,
  "category": "Electronics",
  "merchantId": "60f5f1d0f6d3f3c8a0f6d3f4",
  "tags": ["wireless", "audio", "bluetooth", "headphones"],
  "images": ["https://example.com/headphones-1.jpg", "https://example.com/headphones-2.jpg"],
  "isActive": true,
  "stock": 150,
  "metadata": {
    "color": "Black",
    "weight": "250g",
    "dimensions": "7.5 x 6.1 x 3.2 inches",
    "warranty": "1 year"
  },
  "createdAt": "2023-01-15T09:30:00.000Z",
  "updatedAt": "2023-01-15T09:30:00.000Z"
}
```

## Additional Documentation

For more detailed documentation, please refer to the [docs](./docs) directory:
- [API Reference](./docs/api-reference.md)
- [Database Schema](./docs/database-schema.md)
- [Search Implementation](./docs/search.md)
- [Deployment Guide](./docs/deployment.md)
