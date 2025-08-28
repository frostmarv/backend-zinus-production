// src/production-order/production-order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionOrderController } from './production-order.controller';
import { ProductionOrderService } from './production-order.service';
import { ProductionOrder } from './production-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionOrder]), // ✅ WAJIB ADA DI SINI!
  ],
  controllers: [ProductionOrderController],
  providers: [ProductionOrderService],
  exports: [ProductionOrderService],
})
export class ProductionOrderModule {}