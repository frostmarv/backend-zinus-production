import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const dbType = process.env.DB_TYPE || (isProduction ? 'postgres' : 'sqlite');

// For CLI operations (migrations, etc.)
const AppDataSource = new DataSource({
  type: dbType as any,
  
  // PostgreSQL configuration
  ...(dbType === 'postgres' && {
    ...(process.env.DATABASE_URL 
      ? { url: process.env.DATABASE_URL }
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432', 10),
          username: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || '',
          database: process.env.PGDATABASE || 'postgres',
        }
    ),
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  }),

  // SQLite configuration
  ...(dbType === 'sqlite' && {
    database: process.env.SQLITE_PATH || 'dev.sqlite',
  }),

  // Common configuration
  synchronize: false, // Always false for CLI operations
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    __dirname + '/../**/*.entity.{js,ts}',
    'src/**/*.entity.{js,ts}',
  ],
  migrations: [
    __dirname + '/../migrations/*.{js,ts}',
    'src/migrations/*.{js,ts}',
  ],
  migrationsTableName: 'migrations',
});

export default AppDataSource;
