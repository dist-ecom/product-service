# Deployment Guide

## Overview

This guide provides instructions for deploying the Product Service in various environments. The service requires MongoDB and Elasticsearch as dependencies.

## Prerequisites

- Node.js (v18+)
- MongoDB (v4.4+)
- Elasticsearch (v7.x+)
- Docker (optional)
- Kubernetes (optional)

## Environment Setup

### 1. Environment Variables

Create a `.env` file with the following variables:

```env
# Application
PORT=3000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/product_service

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1d

# Logging
LOG_LEVEL=info
```

### 2. Dependencies

#### MongoDB Setup
```bash
# Install MongoDB
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongodb
```

#### Elasticsearch Setup
```bash
# Install Elasticsearch
# Ubuntu/Debian
wget https://artifacts.elastic.co/GPG-KEY-elasticsearch
sudo rpm --import GPG-KEY-elasticsearch
sudo apt-get install elasticsearch

# macOS
brew install elasticsearch

# Start Elasticsearch
sudo systemctl start elasticsearch
```

## Deployment Options

### 1. Direct Deployment

#### Build the Application
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm run start:prod
```

### 2. Docker Deployment

#### Create Dockerfile
```dockerfile
# Use Node.js LTS version
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]
```

#### Create docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/product_service
      - ELASTICSEARCH_NODE=http://elasticsearch:9200
    depends_on:
      - mongodb
      - elasticsearch

  mongodb:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

volumes:
  mongodb_data:
  elasticsearch_data:
```

#### Deploy with Docker
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Kubernetes Deployment

#### Create Kubernetes Configurations

1. **Deployment Configuration**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
      - name: product-service
        image: your-registry/product-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongodb-uri
        - name: ELASTICSEARCH_NODE
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: elasticsearch-node
```

2. **Service Configuration**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: product-service
spec:
  selector:
    app: product-service
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

3. **Secrets Configuration**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  mongodb-uri: <base64-encoded-mongodb-uri>
  elasticsearch-node: <base64-encoded-elasticsearch-node>
  jwt-secret: <base64-encoded-jwt-secret>
```

#### Deploy to Kubernetes
```bash
# Apply configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services
```

## Monitoring and Maintenance

### 1. Health Checks

Implement health check endpoints:
```typescript
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: await this.checkMongoDB(),
      elasticsearch: await this.checkElasticsearch()
    }
  };
}
```

### 2. Logging

Configure logging:
```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
}
```

### 3. Backup Strategy

#### MongoDB Backup
```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/product_service" --out=/backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb://localhost:27017/product_service" /backup/20240101
```

#### Elasticsearch Backup
```bash
# Create snapshot
curl -X PUT "localhost:9200/_snapshot/backup/snapshot_1?wait_for_completion=true"

# Restore snapshot
curl -X POST "localhost:9200/_snapshot/backup/snapshot_1/_restore?wait_for_completion=true"
```

## Scaling

### 1. Horizontal Scaling

- Deploy multiple instances behind a load balancer
- Use MongoDB replica sets for database scaling
- Configure Elasticsearch cluster for search scaling

### 2. Vertical Scaling

- Increase container resources (CPU/Memory)
- Optimize MongoDB and Elasticsearch configurations
- Implement caching strategies

## Security Considerations

1. **Network Security**
   - Use HTTPS
   - Implement API Gateway
   - Configure firewalls

2. **Data Security**
   - Encrypt sensitive data
   - Use secure connections
   - Implement proper access control

3. **Application Security**
   - Keep dependencies updated
   - Implement rate limiting
   - Use security headers

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Check MongoDB service status
   - Verify connection string
   - Check network connectivity

2. **Elasticsearch Issues**
   - Check Elasticsearch service status
   - Verify index mappings
   - Check cluster health

3. **Application Issues**
   - Check application logs
   - Verify environment variables
   - Check resource usage

### Debug Tools

1. **MongoDB**
   ```bash
   mongosh
   db.adminCommand({ ping: 1 })
   ```

2. **Elasticsearch**
   ```bash
   curl -X GET "localhost:9200/_cluster/health?pretty"
   ```

3. **Application**
   ```bash
   # View logs
   docker-compose logs -f app
   
   # Check status
   curl http://localhost:3000/health
   ``` 