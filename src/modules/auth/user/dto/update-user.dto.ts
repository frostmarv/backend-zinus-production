// src/modules/auth/user/dto/update-user.dto.ts
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Role } from '../../../../common/enums/role.enum';
import { Department } from '../../../../common/enums/department.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nama?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @IsOptional()
  @IsString()
  nomorHp?: string;
}
