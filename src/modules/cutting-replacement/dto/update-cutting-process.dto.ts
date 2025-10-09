import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { CreateCuttingProcessDto } from './create-cutting-process.dto';
import { CuttingProcessStatus } from '../entities/cutting-process.entity';

export class UpdateCuttingProcessDto extends PartialType(CreateCuttingProcessDto) {
  @IsEnum(CuttingProcessStatus)
  @IsOptional()
  status?: CuttingProcessStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  processedQty?: number;
}
