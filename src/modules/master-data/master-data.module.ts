// src/modules/master-data/master-data.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';

// Import related entities
import { Customer } from '../../entities/customer.entity';
import { Product } from '../../entities/product.entity';
import { ProductionOrder } from '../../entities/production-order.entity';
import { ProductionOrderItem } from '../../entities/production-order-item.entity';
import { AssemblyLayer } from '../../entities/assembly-layer.entity';
import { ProductionCuttingEntry } from '../cutting/production-cutting-entry.entity';
import { BondingSummary } from '../../entities/bonding-summary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Product,
      ProductionOrder,
      ProductionOrderItem,
      AssemblyLayer,
      ProductionCuttingEntry,
      BondingSummary,
    ]),
  ],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
