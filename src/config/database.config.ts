// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Use PostgreSQL if DATABASE_URL is available, otherwise fall back to SQLite
  const usePostgres = process.env.DATABASE_URL || process.env.DB_TYPE === 'postgres';

  if (usePostgres) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      username: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'postgres',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      synchronize: process.env.DB_SYNC === 'true' || process.env.NODE_ENV === 'development',
      logging: process.env.DB_LOGGING === 'true' || process.env.NODE_ENV === 'development',
    };
  }

  // Fallback to SQLite for local development
  const sqlitePath = process.env.SQLITE_PATH || 'db.sqlite';

  return {
    type: 'sqlite',
    database: sqlitePath,
    synchronize: process.env.DB_SYNC !== 'false',
    logging: process.env.DB_LOGGING === 'true',
  };
});
