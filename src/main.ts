import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  
  // Get application config
  const port = configService.get<number>('PORT') || 3001;
  const serviceName = configService.get<string>('SERVICE_NAME') || 'product-service';
  const serviceDescription = configService.get<string>('SERVICE_DESCRIPTION') || 'Product Management and Search Service';
  const serviceRegistryUrl = configService.get<string>('SERVICE_REGISTRY_URL');

  // Enable validation
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable CORS
  app.enableCors();

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Product Service API')
    .setDescription('The Product Service API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Save Swagger JSON to file
  fs.writeFileSync('./api-docs.json', JSON.stringify(document, null, 2));

  // Start the server
  await app.listen(port);
  
  // Register with service registry if configured
  if (serviceRegistryUrl) {
    try {
      const httpService = app.get(HttpService);
      
      // Get hostname and IP
      const hostname = os.hostname();
      const networkInterfaces = os.networkInterfaces();
      let ipAddress = '';
      
      // Find a suitable IP address (prefer non-internal IPv4)
      Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName].forEach((iface) => {
          if (iface.family === 'IPv4' && !iface.internal) {
            ipAddress = iface.address;
          }
        });
      });
      
      // If no external IP found, use localhost
      if (!ipAddress) {
        ipAddress = '127.0.0.1';
      }
      
      // In Docker, use the container name as the service address
      const serviceAddress = process.env.NODE_ENV === 'production' ? hostname : ipAddress;
      
      // Register service with Consul
      await httpService.put(`${serviceRegistryUrl}/v1/agent/service/register`, {
        ID: `${serviceName}-${hostname}`,
        Name: serviceName,
        Address: serviceAddress,
        Port: port,
        Check: {
          HTTP: `http://${serviceAddress}:${port}/health`,
          Interval: '15s',
          Timeout: '5s',
        },
        Tags: ['api', 'product-service', 'nestjs'],
        Meta: {
          Description: serviceDescription,
        },
      }).toPromise();
      
      logger.log(`Service registered with registry at ${serviceRegistryUrl}`);
      
      // Setup deregistration on app shutdown
      app.enableShutdownHooks();
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        try {
          await httpService.put(
            `${serviceRegistryUrl}/v1/agent/service/deregister/${serviceName}-${hostname}`
          ).toPromise();
          logger.log('Service deregistered from registry');
          process.exit(0);
        } catch (error) {
          logger.error('Failed to deregister service', error);
          process.exit(1);
        }
      });
    } catch (error) {
      logger.error('Failed to register service with registry', error);
    }
  }
  
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
