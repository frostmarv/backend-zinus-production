// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const dbType = process.env.DB_TYPE || (isProduction ? 'postgres' : 'sqlite');

  console.log(`🔧 Database Configuration: ${dbType} (${isProduction ? 'production' : 'development'})`);

  if (dbType === 'postgres') {
    const config = {
      type: 'postgres' as const,
      // Render provides DATABASE_URL, use it if available
      ...(process.env.DATABASE_URL && { url: process.env.DATABASE_URL }),
      // Fallback to individual connection params
      ...(!process.env.DATABASE_URL && {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        username: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        database: process.env.PGDATABASE || 'postgres',
      }),
      // SSL configuration for production
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      // Connection pool settings for production
      extra: isProduction ? {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
      } : {},
      // Schema synchronization (NEVER true in production)
      synchronize: process.env.DB_SYNC === 'true' && !isProduction,
      // Logging
      logging: process.env.DB_LOGGING === 'true' || (!isProduction && process.env.DB_LOGGING !== 'false'),
      // Migration settings
      migrationsRun: isProduction,
      migrations: ['dist/migrations/*.js'],
      migrationsTableName: 'migrations',
    };

    // Log configuration (without sensitive data)
    console.log('📊 PostgreSQL Config:', {
      hasUrl: !!process.env.DATABASE_URL,
      host: config.url ? '[from URL]' : config.host,
      port: config.url ? '[from URL]' : config.port,
      database: config.url ? '[from URL]' : config.database,
      ssl: !!config.ssl,
      synchronize: config.synchronize,
      logging: config.logging,
    });

    return config;
  }

  // SQLite configuration for development
  const sqlitePath = process.env.SQLITE_PATH || 'dev.sqlite';
  
  const config = {
    type: 'sqlite' as const,
    database: sqlitePath,
    synchronize: process.env.DB_SYNC !== 'false',
    logging: process.env.DB_LOGGING === 'true',
  };

  console.log('📊 SQLite Config:', {
    database: config.database,
    synchronize: config.synchronize,
    logging: config.logging,
  });

  return config;
});
