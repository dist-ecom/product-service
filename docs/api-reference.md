# API Reference

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Products

#### Create Product
- **Method**: POST
- **Path**: `/products`
- **Description**: Create a new product
- **Authentication**: Required
- **Authorization**: Admin role required
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "price": "number",
    "category": "string",
    "tags": ["string"],
    "images": ["string"],
    "isActive": "boolean",
    "stock": "number",
    "metadata": {
      "key": "value"
    }
  }
  ```
- **Response**: 201 Created
  ```json
  {
    "statusCode": 201,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "category": "string",
      "tags": ["string"],
      "images": ["string"],
      "isActive": "boolean",
      "stock": "number",
      "metadata": {
        "key": "value"
      },
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  }
  ```

#### Get All Products
- **Method**: GET
- **Path**: `/products`
- **Description**: Get a list of all products
- **Authentication**: Required
- **Response**: 200 OK
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "_id": "string",
        "name": "string",
        "description": "string",
        "price": "number",
        "category": "string",
        "tags": ["string"],
        "images": ["string"],
        "isActive": "boolean",
        "stock": "number",
        "metadata": {
          "key": "value"
        },
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ]
  }
  ```

#### Search Products
- **Method**: GET
- **Path**: `/products/search`
- **Description**: Search products using full-text search
- **Authentication**: Required
- **Query Parameters**:
  - `q`: Search query string
- **Response**: 200 OK
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "_id": "string",
        "name": "string",
        "description": "string",
        "price": "number",
        "category": "string",
        "tags": ["string"]
      }
    ]
  }
  ```

#### Get Products by Category
- **Method**: GET
- **Path**: `/products/category/:category`
- **Description**: Get products in a specific category
- **Authentication**: Required
- **Path Parameters**:
  - `category`: Category name
- **Response**: 200 OK
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "_id": "string",
        "name": "string",
        "description": "string",
        "price": "number",
        "category": "string",
        "tags": ["string"],
        "images": ["string"],
        "isActive": "boolean",
        "stock": "number",
        "metadata": {
          "key": "value"
        },
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ]
  }
  ```

#### Get Product by ID
- **Method**: GET
- **Path**: `/products/:id`
- **Description**: Get a specific product by ID
- **Authentication**: Required
- **Path Parameters**:
  - `id`: Product ID
- **Response**: 200 OK
  ```json
  {
    "statusCode": 200,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "category": "string",
      "tags": ["string"],
      "images": ["string"],
      "isActive": "boolean",
      "stock": "number",
      "metadata": {
        "key": "value"
      },
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  }
  ```

#### Update Product
- **Method**: PATCH
- **Path**: `/products/:id`
- **Description**: Update a product's information
- **Authentication**: Required
- **Authorization**: Admin role required
- **Path Parameters**:
  - `id`: Product ID
- **Request Body**: Partial product object
- **Response**: 200 OK
  ```json
  {
    "statusCode": 200,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "category": "string",
      "tags": ["string"],
      "images": ["string"],
      "isActive": "boolean",
      "stock": "number",
      "metadata": {
        "key": "value"
      },
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  }
  ```

#### Delete Product
- **Method**: DELETE
- **Path**: `/products/:id`
- **Description**: Delete a product
- **Authentication**: Required
- **Authorization**: Admin role required
- **Path Parameters**:
  - `id`: Product ID
- **Response**: 200 OK
  ```json
  {
    "statusCode": 200,
    "message": "Product deleted successfully"
  }
  ```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
``` 