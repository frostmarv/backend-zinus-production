import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; // 👈 Tambahkan ini
import { User } from './entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './user/user.service'; // 👈 Import UserService
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // 👈 Tambahkan ini

@Module({
  imports: [
    PassportModule, // 👈 Tambahkan ini
    TypeOrmModule.forFeature([User]), // Ini membuat Repository<User> tersedia untuk UserService
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'zinus-production-secret-key-2025',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService, // 👈 Tambahkan UserService ke providers
    JwtStrategy,
    JwtAuthGuard, // 👈 Tambahkan JwtAuthGuard
  ],
  exports: [
    AuthService,
    UserService, // 👈 Export UserService agar bisa digunakan di modul lain
    JwtAuthGuard, // 👈 Export JwtAuthGuard jika diperlukan di modul lain
  ],
})
export class AuthModule {}
