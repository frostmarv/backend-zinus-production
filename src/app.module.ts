// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';

// Core / App-level
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature Modules (diurutkan alfabetis untuk konsistensi)
import { AssemblyLayersModule } from './modules/assembly-layers/assembly-layers.module';
import { BondingModule } from './modules/bonding/bonding.module';
import { BondingRejectModule } from './modules/bonding-reject/bonding-reject.module';
import { CuttingModule } from './modules/cutting/cutting.module';
import { CuttingReplacementModule } from './modules/cutting-replacement/cutting-replacement.module';
import { CustomersModule } from './modules/customers/customers.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProductModule } from './modules/products/product.module';
import { ProductionOrderModule } from './modules/production-order/production-order.module';
import { ProductionOrderItemModule } from './modules/production-order-item/production-order-item.module';
import { ProductionPlanningModule } from './modules/production-planning/production-planning.module';
import { ReplacementModule } from './modules/replacement/replacement.module';
import { WorkableBondingModule } from './modules/workable-bonding/workable-bonding.module';
import { WorkableLiveModule } from './modules/workable-live/live.module';

// 🔐 Authentication Module (cukup import module-nya saja)
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/auth/user/user.module';

// External Services & Controllers
import { DocumentController } from './routes/document.controller';
import { GoogleDriveService } from './services/google-drive.service';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    // Konfigurasi Environment
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
      validate,
    }),

    // Database Configuration (menggunakan factory async)
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

    // 🔐 Modul Autentikasi
    AuthModule,
    UserModule,

    // Feature Modules (urut alfabetis)
    AssemblyLayersModule,
    BondingModule,
    BondingRejectModule,
    CuttingModule,
    CuttingReplacementModule,
    CustomersModule,
    MasterDataModule,
    NotificationModule,
    ProductModule,
    ProductionOrderModule,
    ProductionOrderItemModule,
    ProductionPlanningModule,
    ReplacementModule,
    ScheduleModule.forRoot(),
    WorkableBondingModule,
    WhatsappModule,
    WorkableLiveModule,
  ],
  controllers: [AppController, DocumentController],
  providers: [AppService, GoogleDriveService],
})
export class AppModule {}
