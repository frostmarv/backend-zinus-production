// src/main.ts
import './polyfills';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigHelper } from './config/config.helper';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get configuration service
  const configService = app.get(ConfigService);
  const configHelper = new ConfigHelper(configService);
  
  // Print configuration summary
  configHelper.printConfigSummary();
  
  // Validate production settings
  const warnings = configHelper.validateProductionConfig();
  if (warnings.length > 0) {
    console.log('⚠️  PRODUCTION WARNINGS:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }

  // ✅ Enable Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ CORS
  const allowedOrigins = configService.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:3000'];
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

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
