// src/modules/cutting/dto/create-cutting.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsIn,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Actual DTO ---
export class CreateActualDto {
  @IsString()
  @IsOptional()
  density?: string;

  @IsString()
  @IsOptional()
  ild?: string;

  @IsString()
  @IsNotEmpty()
  colour: string;

  @IsNumber()
  @IsNotEmpty()
  length: number;

  @IsNumber()
  @IsNotEmpty()
  width: number;

  @IsNumber()
  @IsNotEmpty()
  height: number;

  @IsNumber()
  @IsNotEmpty()
  qtyBalok: number;

  @IsNumber()
  @IsNotEmpty()
  qtyProduksi: number;

  @IsString()
  @IsNotEmpty()
  reSize: string;

  @IsNumber()
  @IsNotEmpty()
  jdfWeight: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsIn(['FLAT', 'HOLE'])
  descript: 'FLAT' | 'HOLE';
}

// --- Balok DTO ---
export class CreateBalokDto {
  @IsString()
  @IsOptional()
  density?: string;

  @IsString()
  @IsOptional()
  ild?: string;

  @IsString()
  @IsNotEmpty()
  colour: string;

  @IsNumber()
  @IsNotEmpty()
  length: number;

  @IsNumber()
  @IsNotEmpty()
  width: number;

  @IsNumber()
  @IsNotEmpty()
  height: number;

  @IsString()
  @IsOptional()
  sizeActual?: string;

  @IsNumber()
  @IsNotEmpty()
  qtyBalok: number;
}

// --- Foaming Date DTO ---
class FoamingDateDto {
  @IsBoolean()
  @IsNotEmpty()
  isChecked: boolean;

  @IsString()
  @IsNotEmpty()
  tanggalSelesai: string;

  @IsString()
  @IsNotEmpty()
  jam: string;
}

// --- Main DTO ---
export class CreateCuttingDto {
  @IsString()
  @IsNotEmpty()
  productionDate: string;

  @IsString()
  @IsNotEmpty()
  shift: string;

  @IsString()
  @IsNotEmpty()
  machine: string;

  @IsString()
  @IsNotEmpty()
  operator: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsString()
  @IsOptional()
  group?: string;

  @IsString()
  @IsOptional()
  timeSlot?: string;

  @IsNumber()
  @IsNotEmpty()
  noUrut: number;

  @IsString()
  @IsOptional()
  week?: string;

  // ✅ REVISI: Ubah dari objek tunggal → array of CreateBalokDto
  @ValidateNested({ each: true }) // ← penting: tambah { each: true }
  @Type(() => CreateBalokDto)
  balok: CreateBalokDto[]; // ✅ Sekarang array!

  // ✅ Tetap array (sudah benar)
  @ValidateNested({ each: true })
  @Type(() => CreateActualDto)
  actual: CreateActualDto[];

  // ✅ Optional, nullable
  @IsOptional()
  @ValidateNested()
  @Type(() => FoamingDateDto)
  foamingDate?: FoamingDateDto | null;
}
