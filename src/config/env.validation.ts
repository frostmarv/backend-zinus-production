// src/config/env.validation.ts
import { plainToClass, Transform } from 'class-transformer';
import { IsEnum, IsString, IsBoolean, IsOptional, IsNumber, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
}

enum DatabaseType {
  SQLite = 'sqlite',
  PostgreSQL = 'postgres',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsEnum(DatabaseType)
  DB_TYPE: DatabaseType = DatabaseType.SQLite;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  PGHOST?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PGPORT?: number;

  @IsOptional()
  @IsString()
  PGUSER?: string;

  @IsOptional()
  @IsString()
  PGPASSWORD?: string;

  @IsOptional()
  @IsString()
  PGDATABASE?: string;

  @IsOptional()
  @IsString()
  SQLITE_PATH?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DB_SYNC?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DB_LOGGING?: boolean;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT?: number;

  @IsOptional()
  @IsString()
  ALLOWED_ORIGINS?: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => {
      console.error(`  - ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`);
    });
    throw new Error('Invalid environment configuration');
  }

  // Custom validation logic
  const env = validatedConfig;

  // PostgreSQL validation
  if (env.DB_TYPE === DatabaseType.PostgreSQL) {
    if (!env.DATABASE_URL && (!env.PGHOST || !env.PGUSER || !env.PGDATABASE)) {
      throw new Error('PostgreSQL requires either DATABASE_URL or PGHOST+PGUSER+PGDATABASE');
    }
  }

  // SQLite validation
  if (env.DB_TYPE === DatabaseType.SQLite && !env.SQLITE_PATH) {
    env.SQLITE_PATH = 'dev.sqlite'; // Default value
  }

  // Production safety checks
  if (env.NODE_ENV === Environment.Production) {
    if (env.DB_SYNC === true) {
      console.warn('⚠️  WARNING: DB_SYNC=true in production is dangerous!');
    }
    
    if (env.DB_TYPE === DatabaseType.SQLite) {
      console.warn('⚠️  WARNING: Using SQLite in production is not recommended');
    }

    if (!env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS.includes('*')) {
      console.warn('⚠️  WARNING: CORS is not properly configured for production');
    }
  }

  console.log('✅ Environment validation passed');
  return validatedConfig;
}