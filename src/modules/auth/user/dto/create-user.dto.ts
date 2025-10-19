// src/modules/auth/user/dto/create-user.dto.ts
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Role } from '../../../../common/enums/role.enum';
import { Department } from '../../../../common/enums/department.enum';

export class CreateUserDto {
  @IsString()
  nama: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsEnum(Department)
  department: Department;

  @IsOptional()
  @IsString()
  nomorHp?: string;
}
