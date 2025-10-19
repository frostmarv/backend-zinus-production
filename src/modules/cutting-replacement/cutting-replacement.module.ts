// src/modules/cutting-replacement/cutting-replacement.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuttingProcess } from './entities/cutting-process.entity';
import { CuttingReplacementService } from './cutting-replacement.service';
import { CuttingReplacementController } from './cutting-replacement.controller';
import { ReplacementModule } from '../replacement/replacement.module';
import { BondingRejectModule } from '../bonding-reject/bonding-reject.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CuttingProcess]),
    ReplacementModule, // Untuk replacementService
    BondingRejectModule, // Untuk bondingRejectService
    NotificationModule, // Untuk notificationService
  ],
  controllers: [CuttingReplacementController],
  providers: [CuttingReplacementService],
  exports: [CuttingReplacementService],
})
export class CuttingReplacementModule {}
