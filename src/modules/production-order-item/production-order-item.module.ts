// src/modules/production-order-item/production-order-item.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionOrderItem } from '../../entities/production-order-item.entity';
import { ProductionOrderItemService } from './production-order-item.service';
import { ProductionOrderItemController } from './production-order-item.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionOrderItem])],
  providers: [ProductionOrderItemService],
  controllers: [ProductionOrderItemController],
  exports: [ProductionOrderItemService],
})
export class ProductionOrderItemModule {}
