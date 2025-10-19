// src/modules/assembly-layers/dto/create-assembly-layer.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateAssemblyLayerDto {
  @IsNotEmpty()
  @IsString()
  product_sku: string; // 👈 Ganti dari product_id

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  second_item_number: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description_line_2?: string;

  @IsOptional()
  @IsInt()
  layer_index?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category_layers?: string;
}
