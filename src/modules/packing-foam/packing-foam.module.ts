// src/packing-foam/packing-foam.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackingFoamSummary } from './entities/packing-foam-summary.entity';
import { PackingFoamController } from './packing-foam.controller';
import { PackingFoamService } from './packing-foam.service';

@Module({
  imports: [TypeOrmModule.forFeature([PackingFoamSummary])],
  controllers: [PackingFoamController],
  providers: [PackingFoamService],
  exports: [PackingFoamService],
})
export class PackingFoamModule {}