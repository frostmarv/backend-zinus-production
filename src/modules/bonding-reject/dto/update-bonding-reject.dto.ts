import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateBondingRejectDto } from './create-bonding-reject.dto';
import { BondingRejectStatus } from '../entities/bonding-reject.entity';

export class UpdateBondingRejectDto extends PartialType(CreateBondingRejectDto) {
  @IsEnum(BondingRejectStatus)
  @IsOptional()
  status?: BondingRejectStatus;
}
