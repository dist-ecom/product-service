import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    description: 'Example of a price update',
    example: 89.99,
  })
  price?: number;

  @ApiPropertyOptional({
    description: 'Example of a description update',
    example:
      'Updated description with new features: improved noise cancellation and extended 30-hour battery life',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Example of a stock update',
    example: 200,
  })
  stock?: number;
}
