import { IsString, IsInt, IsOptional, MaxLength } from 'class-validator';

export class UpdateAssemblyLayerDto {
  @IsOptional()
  @IsInt()
  product_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  second_item_number?: string;

  @IsOptional()
  @IsString()
  description?: string;

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
