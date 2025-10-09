import { IsEnum, IsNotEmpty, IsNumber, IsString, Min, IsOptional } from 'class-validator';
import { ShiftType, GroupType } from '../entities/bonding-reject.entity';

export class CreateBondingRejectDto {
  @IsEnum(ShiftType)
  @IsNotEmpty()
  shift: ShiftType;

  @IsEnum(GroupType)
  @IsNotEmpty()
  group: GroupType;

  @IsString()
  @IsNotEmpty()
  timeSlot: string;

  @IsString()
  @IsOptional()
  machine?: string;

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

  @IsString()
  @IsNotEmpty()
  customerPo: string;

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
}
