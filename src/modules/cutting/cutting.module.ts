// src/modules/cutting/cutting.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuttingController } from './cutting.controller';
import { CuttingService } from './cutting.service';
import { CuttingRecord } from './cutting.entity';
import { BalokEntity } from './balok.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CuttingRecord, BalokEntity])],
  controllers: [CuttingController],
  providers: [CuttingService],
})
export class CuttingModule {}