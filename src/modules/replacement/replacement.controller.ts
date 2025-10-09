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
import { ReplacementService } from './replacement.service';
import { CreateReplacementDto } from './dto/create-replacement.dto';
import { UpdateReplacementDto } from './dto/update-replacement.dto';
import { DepartmentType, ReplacementStatus } from './entities/replacement-progress.entity';

@Controller('replacement')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ReplacementController {
  constructor(private readonly replacementService: ReplacementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateReplacementDto) {
    const replacement = await this.replacementService.createRequest(createDto);

    return {
      success: true,
      message: 'Replacement request created successfully',
      data: replacement,
    };
  }

  @Get()
  async findAll(
    @Query('sourceDept') sourceDept?: DepartmentType,
    @Query('targetDept') targetDept?: DepartmentType,
    @Query('sourceBatchNumber') sourceBatchNumber?: string,
    @Query('status') status?: ReplacementStatus,
  ) {
    const filters: any = {};

    if (sourceDept) filters.sourceDept = sourceDept;
    if (targetDept) filters.targetDept = targetDept;
    if (sourceBatchNumber) filters.sourceBatchNumber = sourceBatchNumber;
    if (status) filters.status = status;

    const data = await this.replacementService.findAll(filters);

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Get('statistics')
  async getStatistics(
    @Query('sourceDept') sourceDept?: DepartmentType,
    @Query('targetDept') targetDept?: DepartmentType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};

    if (sourceDept) filters.sourceDept = sourceDept;
    if (targetDept) filters.targetDept = targetDept;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const statistics = await this.replacementService.getStatistics(filters);

    return {
      success: true,
      data: statistics,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.replacementService.findOne(id);

    return {
      success: true,
      data,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReplacementDto,
  ) {
    const data = await this.replacementService.update(id, updateDto);

    return {
      success: true,
      message: 'Replacement updated successfully',
      data,
    };
  }

  @Put(':id/processed-qty')
  async updateProcessedQty(
    @Param('id') id: string,
    @Body('processedQty') processedQty: number,
  ) {
    const data = await this.replacementService.updateProcessedQty(id, processedQty);

    return {
      success: true,
      message: 'Processed quantity updated successfully',
      data,
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReplacementStatus,
  ) {
    const data = await this.replacementService.updateStatus(id, status);

    return {
      success: true,
      message: 'Status updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.replacementService.remove(id);
  }
}
