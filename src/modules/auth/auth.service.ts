import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { Department } from '../../common/enums/department.enum';

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

    return {
      access_token: this.jwtService.sign(payload),
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

  // 🔐 Helper: buat user pertama (hanya untuk dev awal)
  async createInitialUser() {
    const email = 'tholibul.ilmi23@gmail.com';
    const existing = await this.userRepository.findOne({ where: { email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('rahasia123', 10);
      const user = this.userRepository.create({
        nama: 'Nurmalik Wijaya',
        email,
        nomorHp: '081282819464',
        department: Department.DEVELOPMENT,
        role: Role.PEMILIK,
        password: hashedPassword,
      });
      await this.userRepository.save(user);
      console.log('✅ User awal berhasil dibuat!');
    }
  }
}
