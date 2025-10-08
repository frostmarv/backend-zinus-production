import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BondingController } from './bonding.controller';
import { BondingService } from './bonding.service';
import { BondingSummary } from '../../entities/bonding-summary.entity';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BondingSummary]),
    GoogleSheetsModule,
  ],
  controllers: [BondingController],
  providers: [BondingService],
  exports: [BondingService],
})
export class BondingModule {}
