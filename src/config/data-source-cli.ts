// src/config/data-source-cli.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Customer } from '../entities/customer.entity';
import { ProductionOrder } from '../entities/production-order.entity';
import { ProductionOrderItem } from '../entities/production-order-item.entity';
import { Product } from '../entities/product.entity';
import { AssemblyLayer } from '../entities/assembly-layer.entity';
import { BondingSummary } from '../entities/bonding-summary.entity';
import { BondingReject } from '../modules/bonding-reject/entities/bonding-reject.entity';
import { ProductionCuttingEntry } from '../modules/cutting/production-cutting-entry.entity';
import { ProductionCuttingRecord } from '../modules/cutting/production-cutting.entity';
import { CuttingRecord } from '../modules/cutting/cutting.entity';
import { ActualEntity } from '../modules/cutting/actual.entity';
import { BalokEntity } from '../modules/cutting/balok.entity';
import { User } from '../modules/auth/entities/user.entity';
import { ReplacementProgress } from '../modules/replacement/entities/replacement-progress.entity';
import { Notification } from '../modules/notification/entities/notification.entity';
import { CuttingProcess } from '../modules/cutting-replacement/entities/cutting-process.entity';

config(); // Load .env

const MigrationDataSource = new DataSource({
  type: 'postgres',
  // Gunakan DATABASE_URL jika tersedia, jika tidak gunakan konfig manual
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        username: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        database: process.env.PGDATABASE || 'postgres',
      }),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  entities: [
    Customer,
    ProductionOrder,
    ProductionOrderItem,
    Product,
    AssemblyLayer,
    BondingSummary,
    BondingReject,
    ProductionCuttingEntry,
    ProductionCuttingRecord,
    CuttingRecord,
    ActualEntity,
    BalokEntity,
    User,
    ReplacementProgress,
    Notification,
    CuttingProcess,
  ],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  synchronize: false,
});

export default MigrationDataSource;