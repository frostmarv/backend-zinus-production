import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SkipAuth } from '../../common/decorators/skip-auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @SkipAuth()
  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Email atau password salah',
      };
    }
    return this.authService.login(user);
  }

  @SkipAuth() // Endpoint ini tidak perlu auth
  @Post('refresh')
  async refresh(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Refresh token tidak ditemukan');
    }

    try {
      return await this.authService.refreshToken(token);
    } catch (e) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }
  }
}
