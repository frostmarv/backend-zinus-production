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
  Logger,
} from '@nestjs/common';
import { CuttingReplacementService } from './cutting-replacement.service';
import { CreateCuttingProcessDto } from './dto/create-cutting-process.dto';
import { UpdateCuttingProcessDto } from './dto/update-cutting-process.dto';
import { CuttingProcessStatus } from './entities/cutting-process.entity';
import { NotificationService } from '../notification/notification.service'; // ✅
import { ReplacementService } from '../replacement/replacement.service'; // ✅
import { BondingRejectService } from '../bonding-reject/bonding-reject.service'; // ✅
// Import enum Department dan Role
import { Department } from '../../common/enums/department.enum';
import { Role } from '../../common/enums/role.enum';

@Controller('cutting/replacement')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CuttingReplacementController {
  private readonly logger = new Logger(CuttingReplacementController.name);

  constructor(
    private readonly cuttingReplacementService: CuttingReplacementService,
    private readonly replacementService: ReplacementService, // ✅
    private readonly bondingRejectService: BondingRejectService, // ✅
    private readonly notificationService: NotificationService, // ✅
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCuttingProcessDto) {
    const cuttingProcess =
      await this.cuttingReplacementService.create(createDto);

    return {
      success: true,
      message: 'Cutting process created successfully',
      cuttingProcess,
    };
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  async processReplacement(
    @Body()
    body: {
      replacementId: string;
      processedQty: number;
      operatorName?: string;
      machineId?: string;
    },
  ) {
    try {
      this.logger.log(
        `Processing replacement ${body.replacementId}, quantity: ${body.processedQty}`,
      );

      const cuttingProcess =
        await this.cuttingReplacementService.processReplacement(
          body.replacementId,
          body.processedQty,
          body.operatorName,
          body.machineId,
        );

      // 🔥 Ambil data replacement dan bonding reject untuk notifikasi
      const replacement = await this.replacementService.findOne(
        body.replacementId,
      );
      const bondingReject = await this.bondingRejectService.findOne(
        replacement.bondingRejectId,
      );

      this.logger.log(
        `Fetched replacement: ${replacement.processedQty}/${replacement.requestedQty}`,
      );
      this.logger.log(
        `Fetched bonding reject: ${bondingReject.batch_number}, NG: ${bondingReject.ng_quantity}`,
      );

      const totalQty = bondingReject.ng_quantity;
      const currentProcessedTotal = replacement.processedQty;
      const processedThisTime = body.processedQty;
      const remaining = totalQty - currentProcessedTotal;

      this.logger.log(
        `Sending notification: ${processedThisTime} processed, total: ${currentProcessedTotal}/${totalQty}, remaining: ${remaining}`,
      );

      // 🔔 Kirim notifikasi update proses ke departemen Bonding (setiap kali ada proses)
      await this.notificationService.sendReplacementUpdateNotification(
        replacement.id,
        bondingReject.batch_number,
        processedThisTime, // Jumlah yang diproses kali ini
        currentProcessedTotal, // Total yang sudah diproses
        totalQty,
      );

      // 🔁 Kirim notifikasi WHATSAPP update ke departemen Bonding
      const bondingRolesToNotify = [
        Role.KASHIFT,
        Role.KANIT,
        Role.ADMIN_PRODUKSI,
      ]; // Sesuaikan role
      const whatsappUpdateMessage = `🔄 *UPDATE REPLACEMENT*\n\nBatch: ${bondingReject.batch_number}\nJumlah: +${processedThisTime} pcs\nTotal: ${currentProcessedTotal}/${totalQty} pcs`;
      await this.notificationService.sendWhatsAppToUsersInDepartment(
        Department.BONDING, // Target departemen
        bondingRolesToNotify, // Target role
        whatsappUpdateMessage, // Pesan
      );

      this.logger.log(`✅ Update notification sent successfully`);

      // 🔔 Kirim notifikasi special jika selesai
      if (remaining === 0) {
        await this.notificationService.sendReplacementCompletedNotification(
          replacement.id,
          bondingReject.batch_number,
          currentProcessedTotal,
          totalQty,
        );

        // 🔁 Kirim notifikasi WHATSAPP completed ke departemen Bonding
        const bondingRolesToNotify = [
          Role.KASHIFT,
          Role.KANIT,
          Role.ADMIN_PRODUKSI,
        ]; // Sesuaikan role
        const whatsappCompletedMessage = `✅ *REPLACEMENT SELESAI*\n\nBatch: ${bondingReject.batch_number}\nJumlah: ${currentProcessedTotal}/${totalQty} pcs\nStatus: Semua replacement selesai.`;
        await this.notificationService.sendWhatsAppToUsersInDepartment(
          Department.BONDING, // Target departemen
          bondingRolesToNotify, // Target role
          whatsappCompletedMessage, // Pesan
        );

        this.logger.log(`✅ Completion notification sent`);
      }

      return {
        success: true,
        message: 'Replacement processed successfully',
        cuttingProcess,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error in processReplacement: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get()
  async findAll(
    @Query('replacementId') replacementId?: string,
    @Query('status') status?: CuttingProcessStatus,
  ) {
    const filters: any = {};

    if (replacementId) filters.replacementId = replacementId;
    if (status) filters.status = status;

    const data = await this.cuttingReplacementService.findAll(filters);

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Get('statistics')
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};

    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const statistics =
      await this.cuttingReplacementService.getStatistics(filters);

    return {
      success: true,
      statistics,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.cuttingReplacementService.findOne(id);

    return {
      success: true,
      data,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCuttingProcessDto,
  ) {
    const data = await this.cuttingReplacementService.update(id, updateDto);

    return {
      success: true,
      message: 'Cutting process updated successfully',
      data,
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: CuttingProcessStatus,
  ) {
    const data = await this.cuttingReplacementService.updateStatus(id, status);

    return {
      success: true,
      message: 'Status updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.cuttingReplacementService.remove(id);
  }
}
