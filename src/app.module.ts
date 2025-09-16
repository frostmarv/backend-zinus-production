// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.get('database');

        return {
          type: 'postgres',
          ...(db.url
            ? { url: db.url }
            : {
                host: db.host,
                port: db.port,
                username: db.username,
                password: db.password,
                database: db.name,
              }),
          ssl: db.ssl ? { rejectUnauthorized: false } : false,
          synchronize: db.synchronize,
          logging: db.logging,
          autoLoadEntities: true, // sudah cukup, jadi entitas otomatis ke-load
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
