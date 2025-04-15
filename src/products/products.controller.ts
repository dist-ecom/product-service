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
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedUserGuard)
  @Roles('admin', 'merchant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
    type: Product,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Only verified merchants and admins can create products.' })
  create(@Body() createProductDto: CreateProductDto, @Request() req) {
    return this.productsService.create(createProductDto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Return all products.', type: [Product] })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Return matching products.', type: [Product] })
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiParam({ name: 'category', description: 'Product category' })
  @ApiResponse({
    status: 200,
    description: 'Return products in the specified category.',
    type: [Product],
  })
  findByCategory(@Param('category') category: string) {
    return this.productsService.findByCategory(category);
  }

  @Get('merchant/:merchantId')
  @ApiOperation({ summary: 'Get products by merchant' })
  @ApiParam({ name: 'merchantId', description: 'Merchant ID' })
  @ApiResponse({
    status: 200,
    description: 'Return products from the specified merchant.',
    type: [Product],
  })
  findByMerchant(@Param('merchantId') merchantId: string) {
    return this.productsService.findByMerchant(merchantId);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get products by tags' })
  @ApiQuery({ name: 'tags', description: 'Product tags', type: [String] })
  @ApiResponse({
    status: 200,
    description: 'Return products with the specified tags.',
    type: [Product],
  })
  findByTags(@Query('tags', new ParseArrayPipe({ items: String })) tags: string[]) {
    return this.productsService.findByTags(tags);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', description: 'Product id' })
  @ApiResponse({ status: 200, description: 'Return the product.', type: Product })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedUserGuard)
  @Roles('admin', 'merchant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product id' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
    type: Product,
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
  @ApiParam({ name: 'id', description: 'Product id' })
  @ApiResponse({ status: 200, description: 'The product has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only verified merchants and admins can delete products.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.id, req.user.role);
  }
}
