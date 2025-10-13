// src/modules/bonding-reject/bonding-reject.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BondingReject } from './entities/bonding-reject.entity';
import { BondingRejectService } from './bonding-reject.service';
import { BondingRejectController } from './bonding-reject.controller';
import { ReplacementModule } from '../replacement/replacement.module';
import { NotificationModule } from '../notification/notification.module';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { GoogleDriveService } from '../../services/google-drive.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BondingReject]),
    ReplacementModule,
    NotificationModule,
  ],
  controllers: [BondingRejectController],
  providers: [BondingRejectService, GoogleSheetsService, GoogleDriveService],
  exports: [BondingRejectService],
})
export class BondingRejectModule {}
