import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { BondingService } from './bonding.service';
import { CreateBondingSummaryDto } from './dto/create-bonding-summary.dto';
import { GoogleSheetsService } from '../../services/google-sheets.service';

@Controller('bonding/summary')
export class BondingController {
  constructor(
    private readonly bondingService: BondingService,
    private readonly sheetsService: GoogleSheetsService,
  ) {}

  @Post('form-input')
  @HttpCode(HttpStatus.CREATED)
  async createSummary(@Body() createBondingSummaryDto: CreateBondingSummaryDto) {
    // 1. Simpan ke database
    const result = await this.bondingService.createSummary(createBondingSummaryDto);

    // 2. Kirim ke Google Sheets: Sheet "Bonding Summary"
    try {
      const row = [
        createBondingSummaryDto.timestamp, // Timestamp
        createBondingSummaryDto.shift, // Shift
        createBondingSummaryDto.group, // Group
        createBondingSummaryDto.time_slot, // Time Slot
        createBondingSummaryDto.machine, // Machine
        createBondingSummaryDto.kashift, // Kashift
        createBondingSummaryDto.admin, // Admin
        createBondingSummaryDto.customer, // Customer
        createBondingSummaryDto.po_number, // PO Number
        createBondingSummaryDto.customer_po, // Customer PO
        createBondingSummaryDto.sku, // SKU
        createBondingSummaryDto.week, // Week
        createBondingSummaryDto.quantity_produksi, // Quantity Produksi
      ];

      await this.sheetsService.appendToDepartmentSheet('bonding', 'summary', [row]);
    } catch (error) {
      console.warn('⚠️ Gagal kirim ke Google Sheets (Bonding Summary):', error.message);
      // Jangan hentikan proses — integrasi opsional
    }

    return result;
  }

  @Get()
  async getAllSummaries() {
    return this.bondingService.getAllSummaries();
  }

  @Get(':id')
  async getSummaryById(@Param('id') id: string) {
    return this.bondingService.getSummaryById(+id);
  }
}
