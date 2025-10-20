// src/config/data-source-cli.ts
import { DataSource } from 'typeorm';
import AppDataSource from './data-source';

const MigrationDataSource = new DataSource({
  ...AppDataSource.options,
  entities: [__dirname + '/../**/*.entity.{js,ts}'], // exclude ViewEntity jika perlu
});

export default MigrationDataSource;
