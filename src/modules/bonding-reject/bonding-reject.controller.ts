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
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { BondingRejectService } from './bonding-reject.service';
import { CreateBondingRejectDto } from './dto/create-bonding-reject.dto';
import { UpdateBondingRejectDto } from './dto/update-bonding-reject.dto';
import { BondingRejectStatus } from './entities/bonding-reject.entity';
import { ReplacementService } from '../replacement/replacement.service';
import { NotificationService } from '../notification/notification.service';
import { DepartmentType } from '../replacement/entities/replacement-progress.entity';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { GoogleDriveService } from '../../services/google-drive.service';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageMetadata } from './entities/bonding-reject.entity';

@Controller('bonding/reject')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BondingRejectController {
  private readonly logger = new Logger(BondingRejectController.name);

  constructor(
    private readonly bondingRejectService: BondingRejectService,
    private readonly replacementService: ReplacementService,
    private readonly notificationService: NotificationService,
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  @Post('form-input')
  @HttpCode(HttpStatus.CREATED)
  async createReject(@Body() createDto: CreateBondingRejectDto) {
    // ✅ Generate batchNumber otomatis di backend (sesuai format dokumentasi)
    const batchNumber = await this.bondingRejectService.generateBatchNumber(
      createDto.shift,
      createDto.group,
    );

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
   * Upload images for a specific bonding reject record to Google Drive
   * POST /api/bonding/reject/:id/upload-images
   */
  @Post(':id/upload-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 files
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif)$/i, // Hanya gambar
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      return {
        success: false,
        message: 'No files uploaded',
      };
    }

    const bondingReject = await this.bondingRejectService.findOne(id);

    try {
      // Upload ke Google Drive dan dapatkan metadata
      const uploadResult =
        await this.googleDriveService.uploadBondingRejectImages(
          id,
          bondingReject.batchNumber,
          files,
        );

      // Update bonding reject record dengan metadata gambar
      const imageMetadata: ImageMetadata[] = uploadResult.files.map((file) => ({
        filename: file.filename,
        driveFileId: file.driveFileId,
        driveLink: file.driveLink,
        size: file.size,
        uploadedAt: new Date(),
      }));

      await this.bondingRejectService.addImages(id, imageMetadata);

      return {
        success: true,
        message: `${files.length} images uploaded successfully to Google Drive`,
        data: {
          bondingRejectId: id,
          batchNumber: bondingReject.batchNumber,
          files: uploadResult.files,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to upload images for reject ${id}:`, error);
      return {
        success: false,
        message: `Failed to upload to Google Drive: ${error.message}`,
        data: {
          bondingRejectId: id,
          batchNumber: bondingReject.batchNumber,
          files: files.map((file) => ({
            originalname: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
          })),
        },
      };
    }
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
            // ✅ Tambahkan kolom untuk jumlah gambar jika perlu
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
