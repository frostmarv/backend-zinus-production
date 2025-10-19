// upload-production-planning.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class ProductionPlanningItemDto {
  @IsString() @IsNotEmpty() itemNumber: string;
  @IsString() @IsNotEmpty() sku: string;
  @IsString() @IsNotEmpty() category: string;
  @IsNumber() @Type(() => Number) specLength: number;
  @IsNumber() @Type(() => Number) specWidth: number;
  @IsNumber() @Type(() => Number) specHeight: number;
  @IsString() @IsNotEmpty() specUnit: string;
  @IsString() @IsNotEmpty() itemDescription: string;

  @IsString() @IsOptional() iD?: string;
  @IsString() @IsOptional() lD?: string;
  @IsString() @IsOptional() sD?: string;
  @IsNumber() @Type(() => Number) @IsNotEmpty() orderQty: number;
  @IsNumber() @Type(() => Number) @IsOptional() sample?: number;
  @IsString() @IsNotEmpty() week: string;
}

export class UploadProductionPlanningDto {
  @IsString() @IsNotEmpty() shipToName: string;
  @IsString() @IsNotEmpty() customerPO: string;
  @IsString() @IsNotEmpty() poNumber: string;
  @IsDateString() @IsOptional() orderDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionPlanningItemDto)
  items: ProductionPlanningItemDto[];
}
