import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, Min, IsObject } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 