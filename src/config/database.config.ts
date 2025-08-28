// src/config/database.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

// 1. Config untuk NestJS ConfigModule
export default registerAs('database', () => ({
  url: process.env.DB_URL || null,
  urlLocal: process.env.DB_URL_LOCAL || null,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  name: process.env.DB_NAME || 'postgres',
  synchronize: process.env.DB_SYNC === 'true',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true',
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
