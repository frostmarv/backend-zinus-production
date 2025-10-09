import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { DepartmentType } from '../entities/replacement-progress.entity';

export class CreateReplacementDto {
  @IsEnum(DepartmentType)
  @IsNotEmpty()
  sourceDept: DepartmentType;

  @IsEnum(DepartmentType)
  @IsNotEmpty()
  targetDept: DepartmentType;

  @IsString()
  @IsNotEmpty()
  sourceBatchNumber: string;

  @IsNumber()
  @Min(1)
  requestedQty: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsUUID()
  @IsOptional()
  bondingRejectId?: string;
}
