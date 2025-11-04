// src/packing-foam/dto/create-packing-foam-summary.dto.ts
import { IsNotEmpty, IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreatePackingFoamSummaryDto {
  @IsNotEmpty()
  @IsString()
  timestamp: string; // ISO UTC string, e.g., "2025-11-03T07:30:00.000Z"

  @IsNotEmpty()
  @IsString()
  shift: string; // "1" or "2"

  @IsNotEmpty()
  @IsString()
  group: string; // "A" or "B"

  @IsNotEmpty()
  @IsString()
  time_slot: string; // e.g., "08.00 - 09.00"

  @IsNotEmpty()
  @IsString()
  machine: string; // e.g., "PUR 1"

  @IsNotEmpty()
  @IsString()
  kashift: string;

  @IsNotEmpty()
  @IsString()
  admin: string;

  @IsNotEmpty()
  @IsString()
  customer: string; // Nama customer (label)

  @IsNotEmpty()
  @IsString()
  po_number: string;

  @IsNotEmpty()
  @IsString()
  customer_po: string;

  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsNotEmpty()
  @IsString()
  week: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity_produksi: number;
}