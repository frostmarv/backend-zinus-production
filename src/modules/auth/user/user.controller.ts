// src/modules/auth/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Role } from '../../../common/enums/role.enum';
import { Request } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ✅ Harus login, tapi TIDAK PERLU PEMILIK
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request & { user: any }) {
    // JwtStrategy mengembalikan { id: payload.sub, ... }
    return this.userService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Req() req: Request & { user: any },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    // JwtStrategy mengembalikan { id: payload.sub, ... }
    return this.userService.updateProfile(req.user.id, updateProfileDto);
  }

  // ✅ Harus login dan role PEMILIK
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: Request & { user: any }) {
    if (req.user.role !== Role.PEMILIK) {
      throw new UnauthorizedException('Hanya pemilik yang bisa mengakses');
    }
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: Request & { user: any },
    @Body() createUserDto: CreateUserDto,
  ) {
    if (req.user.role !== Role.PEMILIK) {
      throw new UnauthorizedException('Hanya pemilik yang bisa register user');
    }
    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Req() req: Request & { user: any }, @Param('id') id: string) {
    if (req.user.role !== Role.PEMILIK) {
      throw new UnauthorizedException(
        'Hanya pemilik yang bisa lihat detail user',
      );
    }
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Req() req: Request & { user: any },
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (req.user.role !== Role.PEMILIK) {
      throw new UnauthorizedException('Hanya pemilik yang bisa edit user');
    }
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/reset-password')
  async resetPassword(
    @Req() req: Request & { user: any },
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    if (req.user.role !== Role.PEMILIK) {
      throw new UnauthorizedException('Hanya pemilik yang bisa reset password');
    }
    return this.userService.resetPassword(id, resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Req() req: Request & { user: any }, @Param('id') id: string) {
    if (req.user.role !== Role.PEMILIK) {
      throw new UnauthorizedException('Hanya pemilik yang bisa hapus user');
    }
    return this.userService.remove(id);
  }
}
