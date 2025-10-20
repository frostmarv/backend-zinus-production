// src/main.ts
// Build: 2025-09-20T18:29:00Z - Added crypto polyfill
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigHelper } from './config/config.helper';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const configHelper = new ConfigHelper(configService);
  configHelper.printConfigSummary();

  const warnings = configHelper.validateProductionConfig();
  if (warnings.length > 0) {
    console.log('⚠️  PRODUCTION WARNINGS:');
    warnings.forEach((warning) => console.log(`   - ${warning}`));
    console.log('');
  }

  // ✅ Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // ✅ Global JWT guard
  app.useGlobalGuards(app.get(JwtAuthGuard));

  // ✅ CORS dari .env
  const nodeEnv = configService.get('NODE_ENV', 'development');
  const rawAllowedOrigins = configService.get<string>('ALLOWED_ORIGINS', '');
  const allowedOrigins = rawAllowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Opsional: tambahkan Replit dev domain jika ada
  const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDevDomain && nodeEnv === 'development') {
    allowedOrigins.push(`https://${replitDevDomain}`);
  }

  // Log origins yang diizinkan
  console.log('🔒 CORS Allowed Origins:', allowedOrigins.length > 0 ? allowedOrigins : ['(none — only requests without origin allowed)']);

  app.enableCors({
    origin: (origin, callback) => {
      // Izinkan permintaan tanpa origin (mobile app, curl, Postman, dll)
      if (!origin) {
        return callback(null, true);
      }

      // Izinkan jika ada di daftar ALLOWED_ORIGINS
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Di development, izinkan juga semua subdomain .replit.dev
      if (nodeEnv === 'development' && origin.endsWith('.replit.dev')) {
        return callback(null, true);
      }

      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = configService.get('PORT', 5000);

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Zinus Backend Server started!`);
  console.log(`📍 URL: http://0.0.0.0:${port}`);
  console.log(`🌍 Environment: ${nodeEnv}`);
  console.log(`🔗 Health Check: http://0.0.0.0:${port}/health`);
  console.log(`📚 API Docs: http://0.0.0.0:${port}/api (if enabled)`);
  console.log('');
}

bootstrap();