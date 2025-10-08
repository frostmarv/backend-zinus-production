// src/modules/google-sheets/google-sheets.module.ts
import { Module } from '@nestjs/common';
import { GoogleSheetsService } from '../../services/google-sheets.service'; // Naik 2 level

@Module({
  providers: [GoogleSheetsService],
  exports: [GoogleSheetsService],
})
export class GoogleSheetsModule {}
