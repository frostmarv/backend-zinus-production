// src/modules/auth/user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // Tambahkan import In
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto'; // ✅ Tambahkan import
import * as bcrypt from 'bcrypt';
// Import enum Department dan Role dari lokasi yang benar
import { Department } from '../../../common/enums/department.enum'; // Sesuaikan path jika berbeda
import { Role } from '../../../common/enums/role.enum'; // Sesuaikan path jika berbeda

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll() {
    const users = await this.usersRepository.find({
      select: [
        'id',
        'nama',
        'email',
        'role',
        'department',
        'nomorHp',
        'createdAt',
        'updatedAt',
      ],
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'nama',
        'email',
        'role',
        'department',
        'nomorHp',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    // Cek apakah email sudah ada
    const existingUser = await this.usersRepository.findOne({
      where: { email: userData.email },
    });
    if (existingUser) {
      throw new Error('Email sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return await this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Jika email di-update, cek apakah email sudah digunakan oleh user lain
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new Error('Email sudah terdaftar');
      }
    }

    // Jika password di-update, hash dulu
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return await this.usersRepository.remove(user);
  }

  // ✅ Method reset password
  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    user.password = hashedPassword;

    return await this.usersRepository.save(user);
  }

  // ✅ Method get profile — dengan logging untuk debugging
  async getProfile(userId: string) {
    console.log(
      '🔍 Mencari user dengan ID (getProfile):',
      userId,
      '| Tipe:',
      typeof userId,
    );

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'nama',
        'email',
        'role',
        'department',
        'nomorHp',
        'createdAt',
        'updatedAt',
      ],
    });

    console.log('👤 User ditemukan:', !!user);

    if (!user) {
      // Ambil semua user untuk debugging (opsional, bisa dihapus nanti)
      const allUsers = await this.usersRepository.find({
        select: ['id', 'email', 'nama'],
      });
      console.log('📋 Semua user di database:', allUsers);

      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  // ✅ Method update profile — dengan logging untuk debugging
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    console.log('🔧 Update profile untuk user ID:', userId);

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Jika email di-update, cek apakah email sudah digunakan oleh user lain
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingUser) {
        throw new Error('Email sudah terdaftar');
      }
    }

    // Jika password di-update, hash dulu
    if (updateProfileDto.password) {
      updateProfileDto.password = await bcrypt.hash(
        updateProfileDto.password,
        10,
      );
    }

    Object.assign(user, updateProfileDto);
    return await this.usersRepository.save(user);
  }

  // 🔁 Method tambahan untuk integrasi Fonnte
  /**
   * Ambil daftar user berdasarkan departemen (enum) dan role (enum)
   */
  async findUsersByDepartmentAndRoles(
    departmentEnum: Department, // Terima enum Department
    rolesEnum: Role[], // Terima enum Role
  ): Promise<{ id: string; nama: string; nomorHp: string }[]> {
    // Gunakan nilai enum langsung dalam query TypeORM
    const users = await this.usersRepository.find({
      where: {
        department: departmentEnum, // Gunakan enum Department
        role: In(rolesEnum), // Gunakan enum Role dengan In()
      },
      select: ['id', 'nama', 'nomorHp'], // hanya ambil data yang dibutuhkan
    });

    // Filter agar nomorHp tidak null/undefined
    return users
      .filter((user) => user.nomorHp)
      .map((user) => ({
        id: user.id,
        nama: user.nama,
        nomorHp: user.nomorHp,
      }));
  }
}
