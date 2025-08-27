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
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    // Daftarkan module produksi
    ProductionOrderModule,
  ],
  controllers: [AppController], // Hanya AppController di sini
  providers: [AppService],
})
export class AppModule {}