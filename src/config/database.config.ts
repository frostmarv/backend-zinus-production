// src/config/database.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

// 1. Config untuk NestJS ConfigModule
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || null,
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  username: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  name: process.env.PGDATABASE || 'postgres',
  synchronize: process.env.DB_SYNC === 'true' || process.env.NODE_ENV === 'development',
  logging: process.env.DB_LOGGING === 'true' || process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  nodeEnv: process.env.NODE_ENV || 'development',
}));

