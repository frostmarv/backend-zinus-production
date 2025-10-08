import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductionPlanningDto {
  @IsString()
  @IsNotEmpty()
  shipToName: string;

  @IsString()
  @IsNotEmpty()
  customerPO: string;

  @IsString()
  @IsNotEmpty()
  poNumber: string;

  @IsString()
  @IsNotEmpty()
  itemNumber: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  spec?: string;

  @IsString()
  @IsOptional()
  itemDescription?: string;

  @IsString()
  @IsOptional()
  iD?: string;

  @IsString()
  @IsOptional()
  lD?: string;

  @IsString()
  @IsOptional()
  sD?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  orderQty: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sample?: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  totalQty: number;

  @IsString()
  @IsNotEmpty()
  week: string;

  @IsString()
  @IsNotEmpty()
  category: string;
}
