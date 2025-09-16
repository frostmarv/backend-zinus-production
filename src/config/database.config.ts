// src/config/database.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

// 1. Config untuk NestJS ConfigModule
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || null,
  urlLocal: process.env.DATABASE_URL || null,
  host: process.env.PGHOST || 'helium',
  port: parseInt(process.env.PGPORT || '5432', 10),
  username: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'password',
  name: process.env.PGDATABASE || 'heliumdb',
  synchronize: true, // For development
  logging: true, // For development
  ssl: false, // Replit database doesn't need SSL in development
  nodeEnv: process.env.NODE_ENV || 'development',
}));

// 2. Factory untuk TypeORM (pakai ConfigService)
export const typeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  const nodeEnv = configService.get<string>('database.nodeEnv');

  const dbUrl =
    nodeEnv === 'development'
      ? configService.get<string>('database.urlLocal')
      : configService.get<string>('database.url');

  return {
    type: 'postgres',
    url: dbUrl,
    autoLoadEntities: true,
    synchronize: configService.get<boolean>('database.synchronize'),
    logging: configService.get<boolean>('database.logging'),
    ssl: configService.get<boolean>('database.ssl')
      ? { rejectUnauthorized: false }
      : false,
  };
};
