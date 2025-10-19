// src/modules/production-planning/dto/create-production-planning.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductionPlanningDto {
  @IsString() @IsNotEmpty() shipToName: string;
  @IsString() @IsNotEmpty() customerPO: string;
  @IsString() @IsNotEmpty() poNumber: string;

  // --- Product fields (akan disimpan ke tabel products) ---
  @IsString() @IsNotEmpty() itemNumber: string;
  @IsString() @IsNotEmpty() sku: string;
  @IsString() @IsNotEmpty() category: string; // 'FOAM' atau 'SPRING'
  @IsNumber() @Type(() => Number) specLength: number;
  @IsNumber() @Type(() => Number) specWidth: number;
  @IsNumber() @Type(() => Number) specHeight: number;
  @IsString() @IsNotEmpty() specUnit: string; // 'IN'
  @IsString() @IsNotEmpty() itemDescription: string;

  // --- Order item fields ---
  @IsString() @IsOptional() iD?: string;
  @IsString() @IsOptional() lD?: string;
  @IsString() @IsOptional() sD?: string;
  @IsNumber() @Type(() => Number) orderQty: number;
  @IsNumber() @Type(() => Number) @IsOptional() sample?: number;
  @IsString() @IsNotEmpty() week: string; // akan di-parseInt
}
