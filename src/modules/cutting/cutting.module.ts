// src/modules/cutting/cutting.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuttingController } from './cutting.controller';
import { CuttingService } from './cutting.service';
import { CuttingRecord } from './cutting.entity';
import { BalokEntity } from './balok.entity';
import { ActualEntity } from './actual.entity';
import { ProductionCuttingRecord } from './production-cutting.entity';
import { ProductionCuttingEntry } from './production-cutting-entry.entity';

// ✅ Fix path: karena sekarang google-sheets ada di folder sendiri
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CuttingRecord,
      BalokEntity,
      ActualEntity,
      ProductionCuttingRecord,
      ProductionCuttingEntry,
    ]),
    GoogleSheetsModule, // ✅ Di-import → service tersedia
  ],
  controllers: [CuttingController],
  providers: [CuttingService],
})
export class CuttingModule {}
