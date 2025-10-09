// src/modules/bonding-reject/bonding-reject.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { BondingRejectService } from './bonding-reject.service';
import { CreateBondingRejectDto } from './dto/create-bonding-reject.dto';
import { UpdateBondingRejectDto } from './dto/update-bonding-reject.dto';
import { BondingRejectStatus } from './entities/bonding-reject.entity';
import { ReplacementService } from '../replacement/replacement.service';
import { NotificationService } from '../notification/notification.service';
import { DepartmentType } from '../replacement/entities/replacement-progress.entity';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Controller('bonding/reject')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BondingRejectController {
  private readonly logger = new Logger(BondingRejectController.name);

  constructor(
    private readonly bondingRejectService: BondingRejectService,
    private readonly replacementService: ReplacementService,
    private readonly notificationService: NotificationService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  @Post('form-input')
  @HttpCode(HttpStatus.CREATED)
  async createReject(@Body() createDto: CreateBondingRejectDto) {
    // ✅ Generate batchNumber otomatis di backend
    const batchNumber = `BR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().substring(0, 6).toUpperCase()}`;

    // 1. Create bonding reject record
    const bondingReject = await this.bondingRejectService.create({
      ...createDto,
      batchNumber, // Tambahkan batchNumber yang digenerate
    });

    // 2. Auto-create replacement request
    const replacement = await this.replacementService.createRequest({
      sourceDept: DepartmentType.BONDING,
      targetDept: DepartmentType.CUTTING,
      sourceBatchNumber: bondingReject.batchNumber,
      requestedQty: bondingReject.ngQuantity,
      remarks: `Auto-generated from bonding NG: ${bondingReject.reason}`,
      bondingRejectId: bondingReject.id,
    });

    // 3. Update bonding reject status
    await this.bondingRejectService.updateStatus(
      bondingReject.id,
      BondingRejectStatus.REPLACEMENT_REQUESTED,
    );

    // 4. Send notifications
    await this.notificationService.sendBondingRejectNotification(
      bondingReject.batchNumber,
      bondingReject.ngQuantity,
      bondingReject.id,
    );

    await this.notificationService.sendReplacementCreatedNotification(
      replacement.id,
      bondingReject.batchNumber,
      bondingReject.ngQuantity,
    );

    // 5. Log to Google Sheets (non-blocking)
    this.logToGoogleSheets(bondingReject).catch((error) => {
      this.logger.error('Failed to log to Google Sheets:', error.message);
    });

    return {
      success: true,
      message:
        'Bonding reject record created and replacement request initiated',
      data: {
        bondingReject,
        replacement,
      },
    };
  }

  /**
   * Helper method to log bonding reject to Google Sheets
   * Non-blocking - errors are logged but don't affect main flow
   */
  private async logToGoogleSheets(bondingReject: any): Promise<void> {
    try {
      await this.googleSheetsService.appendToDepartmentSheet(
        'bonding',
        'ng_log',
        [
          [
            bondingReject.batchNumber,
            bondingReject.timestamp.toISOString(),
            bondingReject.shift,
            bondingReject.group,
            bondingReject.timeSlot,
            // ❌ HAPUS machine
            bondingReject.kashift,
            bondingReject.admin,
            bondingReject.customer,
            bondingReject.poNumber,
            // ❌ HAPUS customerPo
            bondingReject.sku,
            bondingReject.sCode,
            bondingReject.ngQuantity,
            bondingReject.reason,
            bondingReject.status,
            // ✅ Tambahkan kolom untuk gambar jika perlu (opsional)
          ],
        ],
      );
      this.logger.log(
        `✅ Logged to Google Sheets: ${bondingReject.batchNumber}`,
      );
    } catch (error) {
      this.logger.warn(`⚠️ Google Sheets logging failed: ${error.message}`);
    }
  }

  @Get()
  async findAll(
    @Query('shift') shift?: string,
    @Query('group') group?: string,
    @Query('status') status?: BondingRejectStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};

    if (shift) filters.shift = shift;
    if (group) filters.group = group;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const data = await this.bondingRejectService.findAll(filters);

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.bondingRejectService.findOne(id);

    return {
      success: true,
      data,
    };
  }

  @Get('batch/:batchNumber')
  async findByBatchNumber(@Param('batchNumber') batchNumber: string) {
    const data = await this.bondingRejectService.findByBatchNumber(batchNumber);

    return {
      success: true,
      data,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBondingRejectDto,
  ) {
    const data = await this.bondingRejectService.update(id, updateDto);

    return {
      success: true,
      message: 'Bonding reject record updated successfully',
      data,
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BondingRejectStatus,
  ) {
    const data = await this.bondingRejectService.updateStatus(id, status);

    return {
      success: true,
      message: 'Status updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.bondingRejectService.remove(id);
  }

  // ❌ HAPUS method uploadImages jika tidak dipakai
  // Karena sekarang gambar dikirim via base64 di form-input
  // Jika tetap ingin pakai multipart, pertahankan — tapi sesuaikan dengan DTO

  @Post('export-to-sheets')
  @HttpCode(HttpStatus.OK)
  async exportToSheets(
    @Query('shift') shift?: string,
    @Query('group') group?: string,
    @Query('status') status?: BondingRejectStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};

    if (shift) filters.shift = shift;
    if (group) filters.group = group;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const records = await this.bondingRejectService.findAll(filters);

    if (records.length === 0) {
      return {
        success: true,
        message: 'No records to export',
        count: 0,
      };
    }

    const rows = records.map((record) => [
      record.batchNumber,
      record.timestamp.toISOString(),
      record.shift,
      record.group,
      record.timeSlot,
      // ❌ HAPUS machine
      record.kashift,
      record.admin,
      record.customer,
      record.poNumber,
      // ❌ HAPUS customerPo
      record.sku,
      record.sCode,
      record.ngQuantity,
      record.reason,
      record.status,
    ]);

    await this.googleSheetsService.appendToDepartmentSheet(
      'bonding',
      'ng_log',
      rows,
    );

    return {
      success: true,
      message: `${rows.length} records exported to Google Sheets`,
      count: rows.length,
    };
  }
}
