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
  product_sku: string;

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
  @IsString() // ✅ Tambah validasi
  @MaxLength(50)
  categoryLayers?: string; // ✅ Ubah jadi camelCase
}