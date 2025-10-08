// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  // Debug environment variables
  console.log('🔍 Environment Variables Debug:');
  console.log(`  NODE_ENV: "${process.env.NODE_ENV}"`);
  console.log(`  DB_TYPE: "${process.env.DB_TYPE}"`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '[SET]' : '[NOT SET]'}`);
  
  const isProduction = process.env.NODE_ENV === 'production';
  const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
  
  // Respect DB_TYPE setting first, then fallback to other detection methods
  const dbType = process.env.DB_TYPE || 
                 (process.env.DATABASE_URL ? 'postgres' : 
                 (isProduction || isRailway ? 'postgres' : 'sqlite'));

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
    synchronize: true, // Enable untuk development agar tabel baru otomatis dibuat
    logging: process.env.DB_LOGGING === 'true',
  };

  console.log('📊 SQLite Config:', {
    database: config.database,
    synchronize: config.synchronize,
    logging: config.logging,
  });

  return config;
});
