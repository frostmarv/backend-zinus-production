// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum'; // Import enum Role
import { Department } from '../../common/enums/department.enum'; // Import enum Department

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Omit<User, 'password'>) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      department: user.department,
    };

    // Access token berlaku 1 jam
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    // Refresh token berlaku 30 hari — ditandatangani dengan secret yang SAMA (JWT_SECRET)
    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '30d' }, // ✅ TANPA secret khusus → pakai JWT_SECRET dari JwtModule
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        nomorHp: user.nomorHp,
        department: user.department,
        role: user.role,
      },
    };
  }

  // Fungsi refresh token — verifikasi dengan secret yang SAMA
  async refreshToken(refreshToken: string) {
    try {
      // ✅ Verifikasi TANPA secret khusus → otomatis pakai JWT_SECRET
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token tidak valid');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User tidak ditemukan');
      }

      // Generate access token baru
      const newPayload = {
        email: user.email,
        sub: user.id,
        role: user.role,
        department: user.department,
      };

      const new_access_token = this.jwtService.sign(newPayload, {
        expiresIn: '1h',
      });

      // Opsional: generate refresh token baru (rolling token)
      const new_refresh_token = this.jwtService.sign(
        { sub: user.id, type: 'refresh' },
        { expiresIn: '30d' },
      );

      return {
        access_token: new_access_token,
        refresh_token: new_refresh_token,
      };
    } catch (e) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }
  }

  async createInitialUser() {
    const email = 'tholibul.ilmi23@gmail.com';
    const existing = await this.userRepository.findOne({ where: { email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('rahasia123', 10);
      const user = this.userRepository.create({
        nama: 'Nurmalik Wijaya',
        email,
        nomorHp: '081282819464',
        department: Department.DEVELOPMENT, // Gunakan enum Department
        role: Role.PEMILIK, // Gunakan enum Role
        password: hashedPassword,
      });
      await this.userRepository.save(user);
      console.log('✅ User awal berhasil dibuat!');
    }
  }
}
