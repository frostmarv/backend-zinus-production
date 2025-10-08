import { IsString, IsNotEmpty, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBondingSummaryDto {
  // Header Information
  @IsDateString()
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
  time_slot: string;

  @IsString()
  @IsNotEmpty()
  machine: string;

  @IsString()
  @IsNotEmpty()
  kashift: string;

  @IsString()
  @IsNotEmpty()
  admin: string;

  // Form Information
  @IsString()
  @IsNotEmpty()
  customer: string;

  @IsString()
  @IsNotEmpty()
  po_number: string;

  @IsString()
  @IsNotEmpty()
  customer_po: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  week: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  quantity_produksi: number;
}
