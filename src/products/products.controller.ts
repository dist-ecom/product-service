import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseArrayPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { UserServiceClient } from '../auth/user-service.client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Product } from './schemas/product.schema';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly userServiceClient: UserServiceClient
  ) {}

  @Get('auth-test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test endpoint to verify authentication' })
  @ApiResponse({ status: 200, description: 'Authentication working' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  authTest(@Request() req) {
    return {
      message: 'Authentication successful',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    };
  }

  @Get('verification-test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test endpoint to check merchant verification status' })
  @ApiResponse({ status: 200, description: 'Returns verification status' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async verificationTest(@Request() req) {
    try {
      const isVerified = await this.userServiceClient.checkUserVerificationStatus(req.user.id);
      return {
        message: 'Verification check successful',
        user: {
          id: req.user.id,
          role: req.user.role
        },
        isVerified
      };
    } catch (error) {
      return {
        message: 'Verification check failed',
        error: error.message,
        status: error.status || 500
      };
    }
  }

  @Get('token-debug')
  @ApiOperation({ summary: 'Debug endpoint to test token parsing' })
  @ApiResponse({ status: 200, description: 'Token parsing result' })
  async tokenDebug(@Request() req) {
    try {
      // Extract the token from the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          message: 'No Bearer token provided',
          authHeader: authHeader || 'none'
        };
      }
      
      const token = authHeader.split(' ')[1];
      
      // For safety, only show part of the token
      const tokenPreview = token.substring(0, 10) + '...' + token.substring(token.length - 10);
      
      return {
        message: 'Token received',
        tokenPreview,
        authHeader
      };
    } catch (error) {
      return {
        message: 'Token parsing failed',
        error: error.message
      };
    }
  }

  @Get('role-debug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug endpoint to view user role information' })
  @ApiResponse({ status: 200, description: 'User role information' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  roleDebug(@Request() req) {
    return {
      message: 'Role information',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        roleType: typeof req.user.role,
        roleUpperCase: req.user.role?.toUpperCase?.() || 'N/A',
        roleLowerCase: req.user.role?.toLowerCase?.() || 'N/A'
      },
      hasAccessToCreate: ['ADMIN', 'MERCHANT'].includes(req.user.role?.toUpperCase?.() || '')
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedUserGuard)
  @Roles('admin', 'merchant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
    type: Product,
    schema: {
      example: {
        _id: '60f5f1d0f6d3f3c8a0f6d3f3',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 20-hour battery life',
        price: 99.99,
        category: 'Electronics',
        merchantId: '60f5f1d0f6d3f3c8a0f6d3f4',
        tags: ['wireless', 'audio', 'bluetooth', 'headphones'],
        images: ['https://example.com/headphones-1.jpg', 'https://example.com/headphones-2.jpg'],
        isActive: true,
        stock: 150,
        metadata: {
          color: 'Black',
          weight: '250g',
          dimensions: '7.5 x 6.1 x 3.2 inches',
          warranty: '1 year'
        },
        createdAt: '2023-01-15T09:30:00.000Z',
        updatedAt: '2023-01-15T09:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Only verified merchants and admins can create products.' })
  create(@Body() createProductDto: CreateProductDto, @Request() req) {
    return this.productsService.create(createProductDto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all products.', 
    type: [Product],
    schema: {
      example: [{
        _id: '60f5f1d0f6d3f3c8a0f6d3f3',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 20-hour battery life',
        price: 99.99,
        category: 'Electronics',
        merchantId: '60f5f1d0f6d3f3c8a0f6d3f4',
        tags: ['wireless', 'audio', 'bluetooth', 'headphones'],
        images: ['https://example.com/headphones-1.jpg', 'https://example.com/headphones-2.jpg'],
        isActive: true,
        stock: 150,
        metadata: {
          color: 'Black',
          weight: '250g',
          dimensions: '7.5 x 6.1 x 3.2 inches',
          warranty: '1 year'
        },
        createdAt: '2023-01-15T09:30:00.000Z',
        updatedAt: '2023-01-15T09:30:00.000Z'
      }]
    }
  })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'headphones' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return matching products.', 
    type: [Product],
    schema: {
      example: [{
        _id: '60f5f1d0f6d3f3c8a0f6d3f3',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 20-hour battery life',
        price: 99.99,
        category: 'Electronics',
        merchantId: '60f5f1d0f6d3f3c8a0f6d3f4',
        tags: ['wireless', 'audio', 'bluetooth', 'headphones'],
        images: ['https://example.com/headphones-1.jpg', 'https://example.com/headphones-2.jpg'],
        isActive: true,
        stock: 150,
        metadata: {
          color: 'Black',
          weight: '250g',
          dimensions: '7.5 x 6.1 x 3.2 inches',
          warranty: '1 year'
        },
        createdAt: '2023-01-15T09:30:00.000Z',
        updatedAt: '2023-01-15T09:30:00.000Z'
      }]
    }
  })
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiParam({ name: 'category', description: 'Product category', example: 'Electronics' })
  @ApiResponse({
    status: 200,
    description: 'Return products in the specified category.',
    type: [Product],
    schema: {
      example: [{
        _id: '60f5f1d0f6d3f3c8a0f6d3f3',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 20-hour battery life',
        price: 99.99,
        category: 'Electronics',
        merchantId: '60f5f1d0f6d3f3c8a0f6d3f4',
        tags: ['wireless', 'audio', 'bluetooth', 'headphones'],
        images: ['https://example.com/headphones-1.jpg', 'https://example.com/headphones-2.jpg'],
        isActive: true,
        stock: 150,
        metadata: {
          color: 'Black',
          weight: '250g',
          dimensions: '7.5 x 6.1 x 3.2 inches',
          warranty: '1 year'
        },
        createdAt: '2023-01-15T09:30:00.000Z',
        updatedAt: '2023-01-15T09:30:00.000Z'
      }]
    }
  })
  findByCategory(@Param('category') category: string) {
    return this.productsService.findByCategory(category);
  }

  @Get('merchant/:merchantId')
  @ApiOperation({ summary: 'Get products by merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID', example: '60f5f1d0f6d3f3c8a0f6d3f4' })
  @ApiResponse({
    status: 200,
    description: 'Return products from the specified merchant.',
    type: [Product],
    schema: {
      example: [{
        _id: '60f5f1d0f6d3f3c8a0f6d3f3',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 20-hour battery life',
        price: 99.99,
        category: 'Electronics',
        merchantId: '60f5f1d0f6d3f3c8a0f6d3f4',
        tags: ['wireless', 'audio', 'bluetooth', 'headphones'],
        images: ['https://example.com/headphones-1.jpg', 'https://example.com/headphones-2.jpg'],
        isActive: true,
        stock: 150,
        metadata: {
          color: 'Black',
          weight: '250g',
          dimensions: '7.5 x 6.1 x 3.2 inches',
          warranty: '1 year'
        },
        createdAt: '2023-01-15T09:30:00.000Z',
        updatedAt: '2023-01-15T09:30:00.000Z'
      }]
    }
  })
  findByMerchant(@Param('merchantId') merchantId: string) {
    return this.productsService.findByMerchant(merchantId);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get products by tags' })
  @ApiQuery({ 
    name: 'tags', 
    description: 'Product tags', 
    type: [String],
    example: ['wireless', 'bluetooth'] 
  })
  @ApiResponse({
    status: 200,
    description: 'Return products with the specified tags.',
    type: [Product],
    schema: {
      example: [{
        _id: '60f5f1d0f6d3f3c8a0f6d3f3',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 20-hour battery life',
        price: 99.99,
        category: 'Electronics',
        merchantId: '60f5f1d0f6d3f3c8a0f6d3f4',
        tags: ['wireless', 'audio', 'bluetooth', 'headphones'],
        images: ['https://example.com/headphones-1.jpg', 'https://example.com/headphones-2.jpg'],
        isActive: true,
        stock: 150,
        metadata: {
          color: 'Black',
          weight: '250g',
          dimensions: '7.5 x 6.1 x 3.2 inches',
          warranty: '1 year'
        },
        createdAt: '2023-01-15T09:30:00.000Z',
        updatedAt: '2023-01-15T09:30:00.000Z'
      }]
    }
  })
  findByTags(@Query('tags', new ParseArrayPipe({ items: String })) tags: string[]) {
    return this.productsService.findByTags(tags);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', description: 'Product id', example: '60f5f1d0f6d3f3c8a0f6d3f3' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the product.', 
    type: Product,
    schema: {
      example: {
        _id: '60f5f1d0f6d3f3c8a0f6d3f3',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 20-hour battery life',
        price: 99.99,
        category: 'Electronics',
        merchantId: '60f5f1d0f6d3f3c8a0f6d3f4',
        tags: ['wireless', 'audio', 'bluetooth', 'headphones'],
        images: ['https://example.com/headphones-1.jpg', 'https://example.com/headphones-2.jpg'],
        isActive: true,
        stock: 150,
        metadata: {
          color: 'Black',
          weight: '250g',
          dimensions: '7.5 x 6.1 x 3.2 inches',
          warranty: '1 year'
        },
        createdAt: '2023-01-15T09:30:00.000Z',
        updatedAt: '2023-01-15T09:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedUserGuard)
  @Roles('admin', 'merchant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product id', example: '60f5f1d0f6d3f3c8a0f6d3f3' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
    type: Product,
    schema: {
      example: {
        _id: '60f5f1d0f6d3f3c8a0f6d3f3',
        name: 'Wireless Bluetooth Headphones',
        description: 'Updated description with new features: improved noise cancellation and extended 30-hour battery life',
        price: 89.99,
        category: 'Electronics',
        merchantId: '60f5f1d0f6d3f3c8a0f6d3f4',
        tags: ['wireless', 'audio', 'bluetooth', 'headphones'],
        images: ['https://example.com/headphones-1.jpg', 'https://example.com/headphones-2.jpg'],
        isActive: true,
        stock: 200,
        metadata: {
          color: 'Black',
          weight: '250g',
          dimensions: '7.5 x 6.1 x 3.2 inches',
          warranty: '1 year'
        },
        createdAt: '2023-01-15T09:30:00.000Z',
        updatedAt: '2023-01-16T14:15:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Only verified merchants and admins can update products.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req) {
    return this.productsService.update(id, updateProductDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedUserGuard)
  @Roles('admin', 'merchant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product id', example: '60f5f1d0f6d3f3c8a0f6d3f3' })
  @ApiResponse({ 
    status: 200, 
    description: 'The product has been successfully deleted.',
    schema: {
      example: {
        message: 'Product deleted successfully',
        id: '60f5f1d0f6d3f3c8a0f6d3f3'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Only verified merchants and admins can delete products.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.id, req.user.role);
  }
}
