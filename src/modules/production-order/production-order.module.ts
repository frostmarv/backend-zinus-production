// src/modules/production-order/production-order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionOrder } from '../../entities/production-order.entity';
import { Customer } from '../../entities/customer.entity';
import { ProductionOrderService } from './production-order.service';
import { ProductionOrderController } from './production-order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionOrder, Customer])],
  providers: [ProductionOrderService],
  controllers: [ProductionOrderController],
  exports: [ProductionOrderService],
})
export class ProductionOrderModule {}
