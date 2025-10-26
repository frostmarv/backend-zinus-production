import { IsString, IsOptional } from 'class-validator';

export class UpdateProductionPlanningDto {
  @IsOptional()
  @IsString()
  sku?: string; // 🔹 Tambahkan field sku

  @IsOptional()
  @IsString()
  iD?: string;

  @IsOptional()
  @IsString()
  lD?: string;

  @IsOptional()
  @IsString()
  sD?: string;

  @IsOptional()
  @IsString()
  orderQty?: string;

  @IsOptional()
  @IsString()
  sample?: string;

  @IsOptional()
  @IsString()
  week?: string;
}