// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';

// Modules
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductionOrderModule } from './modules/production-order/production-order.module';
import { CuttingModule } from './modules/cutting/cutting.module';

@Module({
  imports: [
    // Load config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),

    // Setup database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.get('database', { infer: true });

        return {
          type: db.type,

          // Untuk SQLite
          ...(db.type === 'sqlite' && {
            database: db.database, // ✅ dari config: 'db.sqlite'
          }),

          // Untuk PostgreSQL
          ...(db.type === 'postgres' && {
            ...(db.url
              ? { url: db.url }
              : {
                  host: db.host,
                  port: db.port,
                  username: db.username,
                  password: db.password,
                  database: db.database, // ✅ BUKAN db.name
                }),
            ssl: db.ssl,
          }),

          // Sync & logging
          synchronize: db.synchronize,
          logging: db.logging,

          // Auto-load entities
          autoLoadEntities: true,
        };
      },
    }),

    // Feature modules
    ProductionOrderModule,
    CuttingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
