// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductionOrderModule } from './production-order/production-order.module';

@Module({
  imports: [
    // Setup database
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production', // Hanya dev
      ssl: {
        rejectUnauthorized: false, // Wajib untuk Railway
      },
    }),

    // Daftarkan module produksi
    ProductionOrderModule,
  ],
  controllers: [AppController], // Hanya AppController di sini
  providers: [AppService],
})
export class AppModule {}