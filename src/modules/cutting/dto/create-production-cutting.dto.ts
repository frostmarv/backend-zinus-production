import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductionCuttingEntryDto {
  @IsString()
  @IsNotEmpty()
  customer: string;

  @IsString()
  @IsNotEmpty()
  poNumber: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  sCode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  quantityOrder: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  quantityProduksi: number;

  @IsString()
  @IsOptional()
  week?: string;

  // ✅ Tambahkan field isHole
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isHole?: boolean;

  // ✅ Tambahkan field foamingDate
  @IsString()
  @IsOptional()
  foamingDate?: string; // ISO string format
}

export class CreateProductionCuttingDto {
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @IsString()
  @IsNotEmpty()
  shift: string;

  @IsString()
  @IsNotEmpty()
  group: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsString()
  @IsOptional()
  machine?: string;

  @IsString()
  @IsOptional()
  operator?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductionCuttingEntryDto)
  entries: CreateProductionCuttingEntryDto[];
}
