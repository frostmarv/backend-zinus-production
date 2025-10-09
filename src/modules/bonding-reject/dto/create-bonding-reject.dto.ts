// src/modules/bonding-reject/dto/create-bonding-reject.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBondingRejectDto {
  @IsString()
  @IsNotEmpty()
  timestamp: string; // ISO string dari frontend, akan di-parse jadi Date di service

  // ✅ Shift dikirim sebagai '1' atau '2'
  @IsString()
  @IsNotEmpty()
  shift: string;

  // ✅ Group dikirim sebagai 'A' atau 'B'
  @IsString()
  @IsNotEmpty()
  group: string;

  @IsString()
  @IsNotEmpty()
  timeSlot: string;

  // ❌ HAPUS machine — tidak dikirim dari form
  // @IsString()
  // @IsOptional()
  // machine?: string;

  @IsString()
  @IsNotEmpty()
  kashift: string;

  @IsString()
  @IsNotEmpty()
  admin: string;

  @IsString()
  @IsNotEmpty()
  customer: string;

  @IsString()
  @IsNotEmpty()
  poNumber: string;

  // ❌ HAPUS customerPo — tidak dikirim dari form
  // @IsString()
  // @IsNotEmpty()
  // customerPo: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  sCode: string;

  @IsNumber()
  @Min(1)
  ngQuantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  // ❌ HAPUS images — tidak lagi dikirim di form input
  // @IsArray()
  // @IsOptional()
  // @IsString({ each: true })
  // images?: string[];
}
