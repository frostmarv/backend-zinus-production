import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UploadProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  products: CreateProductDto[];
}