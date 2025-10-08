// src/modules/cutting/dto/update-cutting.dto.ts
import {
  IsString,
  IsOptional,
  ValidateNested,
  IsIn,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateBalokDto {
  @IsOptional() @IsString() density?: string;
  @IsOptional() @IsString() ild?: string;
  @IsOptional() @IsString() colour?: string;
  @IsOptional() @IsNumber() length?: number;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() sizeActual?: string;
  @IsOptional() @IsNumber() qtyBalok?: number;
}

class UpdateActualDto {
  @IsOptional() @IsString() density?: string;
  @IsOptional() @IsString() ild?: string;
  @IsOptional() @IsString() colour?: string;
  @IsOptional() @IsNumber() length?: number;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsNumber() qtyBalok?: number;
  @IsOptional() @IsNumber() qtyProduksi?: number; // ✅
  @IsOptional() @IsString() reSize?: string; // ✅
  @IsOptional() @IsNumber() jdfWeight?: number; // ✅
  @IsOptional() @IsString() remark?: string; // ✅
  @IsOptional() @IsIn(['FLAT', 'HOLE']) descript?: 'FLAT' | 'HOLE';
}

export class UpdateCuttingDto {
  @IsOptional() @IsString() productionDate?: string;
  @IsOptional() @IsString() shift?: string;
  @IsOptional() @IsString() machine?: string;
  @IsOptional() @IsString() operator?: string;
  @IsOptional() @IsString() time?: string;
  @IsOptional() @IsNumber() noUrut?: number;
  @IsOptional() @IsString() week?: string;

  @IsOptional()
  foamingDate?: {
    isChecked: boolean;
    tanggalSelesai?: string;
    jam?: string;
  } | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBalokDto)
  balok?: UpdateBalokDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateActualDto)
  actual?: UpdateActualDto[];
}
