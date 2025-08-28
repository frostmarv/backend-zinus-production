import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const useUrl = !!process.env.DB_URL;

const AppDataSource = new DataSource({
  type: (process.env.DB_TYPE as any) || 'postgres',
  url: useUrl ? process.env.DB_URL : undefined,
  host: useUrl ? undefined : process.env.DB_HOST,
  port: useUrl ? undefined : Number(process.env.DB_PORT || 5432),
  username: useUrl ? undefined : process.env.DB_USERNAME,
  password: useUrl ? undefined : process.env.DB_PASSWORD,
  database: useUrl ? undefined : process.env.DB_NAME,
  synchronize: process.env.DB_SYNC === 'true',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
});

export default AppDataSource;
