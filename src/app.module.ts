// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';

// Feature modules
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CuttingModule } from './modules/cutting/cutting.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductModule } from './modules/products/product.module';
import { ProductionOrderItemModule } from './modules/production-order-item/production-order-item.module';
import { ProductionOrderModule } from './modules/production-order/production-order.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { ProductionPlanningModule } from './modules/production-planning/production-planning.module';
import { AssemblyLayersModule } from './modules/assembly-layers/assembly-layers.module';
import { WorkableBondingModule } from './modules/workable-bonding/workable-bonding.module';
import { BondingModule } from './modules/bonding/bonding.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
      validate,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.get('database', { infer: true });

        return {
          type: db.type,
          ...(db.type === 'sqlite' && { database: db.database }),
          ...(db.type === 'postgres' && {
            ...(db.url
              ? { url: db.url }
              : {
                  host: db.host,
                  port: db.port,
                  username: db.username,
                  password: db.password,
                  database: db.database,
                }),
            ssl: db.ssl,
          }),
          synchronize: db.synchronize,
          logging: db.logging,
          autoLoadEntities: true,
        };
      },
    }),

    // Feature modules
    CuttingModule,
    CustomersModule,
    ProductModule,
    ProductionOrderItemModule,
    ProductionOrderModule,
    MasterDataModule,
    ProductionPlanningModule,
    AssemblyLayersModule,
    WorkableBondingModule,
    BondingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
