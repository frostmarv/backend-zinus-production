import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCuttingProcessDto {
  @IsUUID()
  @IsNotEmpty()
  replacementId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  processedQty?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  operatorName?: string;

  @IsString()
  @IsOptional()
  machineId?: string;
}
