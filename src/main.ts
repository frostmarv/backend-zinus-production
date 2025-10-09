// src/main.ts
// Build: 2025-09-20T18:29:00Z - Added crypto polyfill
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigHelper } from './config/config.helper';
import { AllExceptionsFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Get configuration service
  const configService = app.get(ConfigService);
  const configHelper = new ConfigHelper(configService);

  // Print configuration summary
  configHelper.printConfigSummary();

  // Validate production settings
  const warnings = configHelper.validateProductionConfig();
  if (warnings.length > 0) {
    console.log('⚠️  PRODUCTION WARNINGS:');
    warnings.forEach((warning) => console.log(`   - ${warning}`));
    console.log('');
  }

  // ✅ Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ Enable global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // ✅ Enable CORS (for Replit or custom origins)
  const replitDevDomain = process.env.REPLIT_DEV_DOMAIN || '';

  // Development origins
  const developmentOrigins = [
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    'https://3000-firebase-zinus-production-app-1759506951245.cluster-w5vd22whf5gmav2vgkomwtc4go.cloudworkstations.dev',
    'https://zinus-production-web.vercel.app',
    `https://${replitDevDomain}`,
  ];

  // Get additional allowed origins from env (for production)
  const additionalOrigins =
    configService.get('ALLOWED_ORIGINS')?.split(',').filter(Boolean) || [];

  // Combine all allowed origins
  const allowedOrigins = [...developmentOrigins, ...additionalOrigins];

  console.log('🔒 CORS Allowed Origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // For development, also allow any replit.dev domains
        if (origin.includes('.replit.dev')) {
          callback(null, true);
        } else {
          console.warn(`⚠️  CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Port & environment
  const port = configService.get('PORT', 5000);
  const nodeEnv = configService.get('NODE_ENV', 'development');

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Zinus Backend Server started!`);
  console.log(`📍 URL: http://0.0.0.0:${port}`);
  console.log(`🌍 Environment: ${nodeEnv}`);
  console.log(`🔗 Health Check: http://0.0.0.0:${port}/health`);
  console.log(`📚 API Docs: http://0.0.0.0:${port}/api (if enabled)`);
  console.log('');
}

bootstrap();
