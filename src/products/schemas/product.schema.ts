import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @ApiProperty({ description: 'The unique identifier of the product' })
  _id: string;

  @ApiProperty({ description: 'The name of the product' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'The description of the product' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'The price of the product' })
  @Prop({ required: true })
  price: number;

  @ApiProperty({ description: 'The category of the product' })
  @Prop({ required: true })
  category: string;

  @ApiPropertyOptional({ description: 'Tags associated with the product', type: [String] })
  @Prop([String])
  tags: string[];

  @ApiPropertyOptional({ description: 'URLs of product images', type: [String] })
  @Prop([String])
  images: string[];

  @ApiProperty({ description: 'Whether the product is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Current stock level' })
  @Prop({ default: 0 })
  stock: number;

  @ApiPropertyOptional({ description: 'Additional product metadata' })
  @Prop({ type: Object })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product); 