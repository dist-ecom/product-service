import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'Wireless Bluetooth Headphones'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the product',
    example: 'High-quality wireless headphones with noise cancellation and 20-hour battery life'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The price of the product in USD',
    example: 99.99
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'The category the product belongs to',
    example: 'Electronics'
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    description: 'Tags associated with the product',
    example: ['wireless', 'audio', 'bluetooth', 'headphones']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'URLs to product images',
    example: ['https://example.com/headphones-1.jpg', 'https://example.com/headphones-2.jpg']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    description: 'Whether the product is currently available for purchase',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Available quantity in stock',
    example: 150
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({
    description: 'Additional product details as key-value pairs',
    example: {
      color: 'Black',
      weight: '250g',
      dimensions: '7.5 x 6.1 x 3.2 inches',
      warranty: '1 year'
    }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
