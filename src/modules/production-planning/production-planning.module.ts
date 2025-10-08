import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionPlanningController } from './production-planning.controller';
import { ProductionPlanningService } from './production-planning.service';

// Import related entities
import { Customer } from '../../entities/customer.entity';
import { Product } from '../../entities/product.entity';
import { ProductionOrder } from '../../entities/production-order.entity';
import { ProductionOrderItem } from '../../entities/production-order-item.entity';
// Note: We'll use raw queries instead of ViewEntity for better compatibility

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Product,
      ProductionOrder,
      ProductionOrderItem,
    ]),
  ],
  controllers: [ProductionPlanningController],
  providers: [ProductionPlanningService],
  exports: [ProductionPlanningService],
})
export class ProductionPlanningModule {}