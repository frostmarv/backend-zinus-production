// src/modules/cutting-replacement/cutting-replacement.controller.ts
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
import { CuttingReplacementService } from './cutting-replacement.service';
import { CreateCuttingProcessDto } from './dto/create-cutting-process.dto';
import { UpdateCuttingProcessDto } from './dto/update-cutting-process.dto';
import { CuttingProcessStatus } from './entities/cutting-process.entity';

@Controller('cutting/replacement')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CuttingReplacementController {
  constructor(
    private readonly cuttingReplacementService: CuttingReplacementService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCuttingProcessDto) {
    const cuttingProcess =
      await this.cuttingReplacementService.create(createDto);

    return {
      success: true,
      message: 'Cutting process created successfully',
      data: cuttingProcess,
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
    const cuttingProcess =
      await this.cuttingReplacementService.processReplacement(
        body.replacementId,
        body.processedQty,
        body.operatorName,
        body.machineId,
      );

    return {
      success: true,
      message: 'Replacement processed successfully',
      data: cuttingProcess,
    };
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
      data: statistics,
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
