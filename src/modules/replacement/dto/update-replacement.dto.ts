import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { CreateReplacementDto } from './create-replacement.dto';
import { ReplacementStatus } from '../entities/replacement-progress.entity';

export class UpdateReplacementDto extends PartialType(CreateReplacementDto) {
  @IsEnum(ReplacementStatus)
  @IsOptional()
  status?: ReplacementStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  processedQty?: number;
}
