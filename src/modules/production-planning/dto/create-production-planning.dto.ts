// src/modules/production-planning/dto/create-production-planning.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProductionPlanningDto {
  @IsString() @IsNotEmpty() shipToName: string;
  @IsString() @IsNotEmpty() customerPO: string;
  @IsString() @IsNotEmpty() poNumber: string;

  // --- Product fields ---
  @IsString() @IsNotEmpty() itemNumber: string;
  @IsString() @IsNotEmpty() sku: string;
  @IsString() @IsNotEmpty() category: string;
  @IsString() @IsNotEmpty() spec: string; // ✅ satu field
  @IsString() @IsNotEmpty() itemDescription: string;

  // --- Order item fields ---
  @IsString() @IsOptional() iD?: string;
  @IsString() @IsOptional() lD?: string;
  @IsString() @IsOptional() sD?: string;
  @IsString() @IsNotEmpty() orderQty: string; // akan di-parse jadi number
  @IsString() @IsOptional() sample?: string;  // akan di-parse jadi number
  @IsString() @IsNotEmpty() week: string;
}