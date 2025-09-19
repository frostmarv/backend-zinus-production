// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'postgres') {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      username: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'postgres',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      synchronize: process.env.DB_SYNC === 'true',
      logging: process.env.DB_LOGGING === 'true',
    };
  }

  // Untuk SQLite — HARUS punya `database`
  const sqlitePath = process.env.SQLITE_PATH || 'db.sqlite';

  return {
    type: 'sqlite',
    database: sqlitePath, // ✅ Wajib!
    synchronize: process.env.DB_SYNC !== 'false',
    logging: process.env.DB_LOGGING === 'true',
  };
});
