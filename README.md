# Product Service

A microservice for managing products in an e-commerce platform built with NestJS, MongoDB, and Elasticsearch.

## Features

- Product CRUD operations
- Category and tag management
- Product search with Elasticsearch
- Image management
- Price and stock tracking
- JWT Authentication
- Role-based authorization

## Prerequisites

- Node.js (v16 or later)
- MongoDB
- Elasticsearch
- User Service (for authentication)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=mongodb://localhost:27017/ecommerce
ELASTICSEARCH_NODE=http://localhost:9200
JWT_SECRET=your_jwt_secret_key
```

## Running the app

```bash
# development
npm run start:dev

# production mode
npm run build
npm run start:prod
```

## API Endpoints

All endpoints except GET requests require authentication with a JWT token from the User Service.

### Authentication

Include the JWT token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Products

- `POST /products` - Create a new product (Admin only)
- `GET /products` - Get all products
- `GET /products/:id` - Get a specific product
- `PATCH /products/:id` - Update a product (Admin only)
- `DELETE /products/:id` - Delete a product (Admin only)
- `GET /products/search?q=query` - Search products
- `GET /products/category/:category` - Get products by category
- `GET /products/tags?tags=tag1,tag2` - Get products by tags

## Example Product Object

```json
{
  "name": "Example Product",
  "description": "This is an example product description",
  "price": 99.99,
  "category": "Electronics",
  "tags": ["gadget", "tech", "new"],
  "images": ["image1.jpg", "image2.jpg"],
  "isActive": true,
  "stock": 100,
  "metadata": {
    "brand": "Example Brand",
    "color": "Black",
    "weight": "1.5kg"
  }
}
```

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Integration with User Service

This service integrates with the User Service for authentication and authorization. The User Service provides:

1. JWT token generation and validation
2. User management
3. Role-based access control

To use protected endpoints:

1. Register/Login through the User Service
2. Get the JWT token
3. Include the token in the Authorization header for Product Service requests

## Error Responses

### Unauthorized (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Forbidden (403)
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Product not found"
}
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
