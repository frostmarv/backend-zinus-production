// src/modules/auth/user/dto/update-user.dto.ts
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  IsNotEmpty,
} from 'class-validator'; // ← tambahkan IsNotEmpty
import { Role } from '../../../../common/enums/role.enum';
import { Department } from '../../../../common/enums/department.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty() // ← tambahkan ini
  nama?: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty() // ← tambahkan ini
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @IsNotEmpty() // ← tambahkan ini
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  @IsNotEmpty() // ← tambahkan ini
  role?: Role;

  @IsOptional()
  @IsEnum(Department)
  @IsNotEmpty() // ← tambahkan ini
  department?: Department;

  @IsOptional()
  @IsString()
  @IsNotEmpty() // ← tambahkan ini
  nomorHp?: string;
}