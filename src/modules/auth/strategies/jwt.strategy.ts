// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'zinus-production-secret-key-2025',
    });
  }

  async validate(payload: any) {
    // Pastikan kompatibel: gunakan payload.sub atau fallback ke payload.id
    const userId = payload.sub || payload.id;

    if (!userId) {
      throw new Error('JWT payload tidak berisi sub atau id');
    }

    // Kembalikan user yang akan disimpan di req.user
    return {
      id: userId,
      email: payload.email,
      role: payload.role,
      department: payload.department,
    };
  }
}
