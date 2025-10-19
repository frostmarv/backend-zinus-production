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
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BondingRejectService } from './bonding-reject.service';
import { CreateBondingRejectDto } from './dto/create-bonding-reject.dto';
import { UpdateBondingRejectDto } from './dto/update-bonding-reject.dto';
import {
  BondingRejectStatus,
  ImageMetadata,
} from './entities/bonding-reject.entity';
import { ReplacementService } from '../replacement/replacement.service';
import { NotificationService } from '../notification/notification.service';
import { DepartmentType } from '../replacement/entities/replacement-progress.entity';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { GoogleDriveService } from '../../services/google-drive.service';
import { SkipAuth } from '../../common/decorators/skip-auth.decorator';
// Import enum Department dan Role
import { Department } from '../../common/enums/department.enum';
import { Role } from '../../common/enums/role.enum';

@Controller('bonding/reject')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BondingRejectController {
  private readonly logger = new Logger(BondingRejectController.name);

  constructor(
    private readonly bondingRejectService: BondingRejectService,
    private readonly replacementService: ReplacementService,
    private readonly notificationService: NotificationService, // Pastikan sudah di-inject
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  @SkipAuth()
  @Post('form-input')
  @HttpCode(HttpStatus.CREATED)
  async createReject(@Body() createDto: CreateBondingRejectDto) {
    const batch_number = await this.bondingRejectService.generateBatchNumber(
      createDto.shift,
      createDto.group,
    );

    const bondingReject = await this.bondingRejectService.create({
      ...createDto,
      batch_number,
    } as CreateBondingRejectDto & { batch_number: string });

    const replacement = await this.replacementService.createRequest({
      sourceDept: DepartmentType.BONDING,
      targetDept: DepartmentType.CUTTING,
      sourceBatchNumber: bondingReject.batch_number,
      requestedQty: bondingReject.ng_quantity,
      remarks: `Auto-generated from bonding NG: ${bondingReject.reason}`,
      bondingRejectId: bondingReject.id,
    });

    await this.bondingRejectService.updateStatus(
      bondingReject.id,
      BondingRejectStatus.REPLACEMENT_REQUESTED,
    );

    await this.notificationService.sendBondingRejectNotification(
      bondingReject.batch_number,
      bondingReject.ng_quantity,
      bondingReject.id,
    );

    await this.notificationService.sendReplacementCreatedNotification(
      replacement.id,
      bondingReject.batch_number,
      bondingReject.ng_quantity,
    );

    // 🔁 GANTI pemanggilan ini: gunakan enum
    await this.notificationService.sendWhatsAppToUsersInDepartment(
      Department.CUTTING, // Gunakan enum Department
      [Role.KASHIFT, Role.KANIT, Role.ADMIN_PRODUKSI], // Gunakan enum Role
      `🚨 *NOTIFIKASI PRODUKSI*\n` +
        `*Departemen:* Bonding → Cutting\n` +
        `*Jenis:* Request NG & Replacement\n` +
        `*Batch:* ${bondingReject.batch_number}\n` +
        `*Qty NG:* ${bondingReject.ng_quantity} pcs\n` +
        `*ID:* ${bondingReject.id}\n` +
        `*Aksi:* Mohon segera proses replacement.`,
    );

    this.logToGoogleSheets(bondingReject).catch((error) =>
      this.logger.error('Failed to log to Google Sheets:', error.message),
    );

    return {
      success: true,
      message:
        'Bonding reject record created and replacement request initiated',
      data: {
        // ✅ Gunakan sintaks objek yang benar
        // ✅ "data:" ditambahkan
        id: bondingReject.id,
        batch_number: bondingReject.batch_number,
        bondingReject,
        replacement,
      },
    };
  }

  @SkipAuth()
  @Post(':id/upload-images')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/i }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      return { success: false, message: 'No files uploaded' };
    }

    const bondingReject = await this.bondingRejectService.findOne(id);

    try {
      const uploadResult =
        await this.googleDriveService.uploadBondingRejectImages(
          bondingReject.batch_number,
          files,
        );

      const imageMetadata: ImageMetadata[] = uploadResult.map((file: any) => ({
        // ✅ typo diperbaiki
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
          // ✅ Gunakan sintaks objek yang benar
          // ✅ "data:" ditambahkan
          bondingRejectId: id,
          batchNumber: bondingReject.batch_number,
          files: uploadResult,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to upload images for reject ${id}:`, error);
      return {
        success: false,
        message: `Failed to upload to Google Drive: ${error.message}`,
        data: {
          // ✅ Gunakan sintaks objek yang benar
          // ✅ "data:" ditambahkan
          bondingRejectId: id,
          batchNumber: bondingReject.batch_number,
          files: files.map((file) => ({
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
          })),
        },
      };
    }
  }

  private async logToGoogleSheets(bondingReject: any): Promise<void> {
    try {
      await this.googleSheetsService.appendToDepartmentSheet(
        'bonding',
        'ng_log',
        [
          [
            bondingReject.batch_number,
            bondingReject.timestamp.toISOString(),
            bondingReject.shift,
            bondingReject.group,
            bondingReject.time_slot,
            bondingReject.kashift,
            bondingReject.admin,
            bondingReject.customer,
            bondingReject.po_number,
            bondingReject.sku,
            bondingReject.s_code,
            bondingReject.description ?? '', // ✅ description ditambahkan
            bondingReject.ng_quantity,
            bondingReject.reason,
            bondingReject.status,
          ],
        ],
      );
      this.logger.log(
        `✅ Logged to Google Sheets: ${bondingReject.batch_number}`,
      );
    } catch (error: any) {
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
    return { success: true, count: data.length, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.bondingRejectService.findOne(id);
    return {
      success: true,
      data: {
        // ✅ Gunakan sintaks objek yang benar
        id: data.id,
        batch_number: data.batch_number,
        ...data,
      },
    };
  }

  @Get('batch/:batchNumber')
  async findByBatchNumber(@Param('batchNumber') batch_number: string) {
    const data =
      await this.bondingRejectService.findByBatchNumber(batch_number);
    return {
      success: true,
      data: {
        // ✅ Gunakan sintaks objek yang benar
        // ✅ "data:" ditambahkan
        id: data.id,
        batch_number: data.batch_number,
        ...data,
      },
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
      message: 'Record updated successfully',
      data: {
        // ✅ Gunakan sintaks objek yang benar
        // ✅ "data:" ditambahkan
        id: data.id,
        batch_number: data.batch_number,
        ...data,
      },
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
      data: {
        // ✅ Gunakan sintaks objek yang benar
        // ✅ "data:" ditambahkan
        id: data.id,
        batch_number: data.batch_number,
        ...data,
      },
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
      return { success: true, message: 'No records to export', count: 0 };
    }

    const rows = records.map((r) => [
      r.batch_number,
      r.timestamp.toISOString(),
      r.shift,
      r.group,
      r.time_slot,
      r.kashift,
      r.admin,
      r.customer,
      r.po_number,
      r.sku,
      r.s_code,
      r.description ?? '', // ✅ description ditambahkan
      r.ng_quantity,
      r.reason,
      r.status,
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
