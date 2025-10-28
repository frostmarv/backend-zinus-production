// src/modules/auth/user/dto/update-profile.dto.ts
import { IsString, IsEmail, IsOptional, MinLength, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nama?: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nomorHp?: string;
}