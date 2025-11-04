import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePackingFoamSummaryDto } from './dto/create-packing-foam-summary.dto';
import { UpdatePackingFoamSummaryDto } from './dto/update-packing-foam-summary.dto';
import { PackingFoamService } from './packing-foam.service';

@Controller('packing-foam')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PackingFoamController {
  constructor(private readonly service: PackingFoamService) {}

  @Post('summary/post')
  async createSummary(@Body() dto: CreatePackingFoamSummaryDto) {
    return await this.service.create(dto);
  }

  @Get('summary')
  async getSummaries() {
    return await this.service.findAll();
  }

  @Put('summary/:id')
  async updateSummary(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePackingFoamSummaryDto,
  ) {
    return await this.service.update(id, dto);
  }

  @Delete('summary/:id')
  async deleteSummary(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.remove(id);
    return { success: true, message: 'Data berhasil dihapus' };
  }
}