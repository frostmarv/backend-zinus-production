// src/modules/cutting/cutting.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CuttingService } from './cutting.service';
import { CreateCuttingDto } from './dto/create-cutting.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('cutting')
@Controller('api/cutting')
export class CuttingController {
  constructor(private readonly cuttingService: CuttingService) {}

  @Post()
  @ApiOperation({ summary: 'Submit data cutting baru' })
  @ApiResponse({
    status: 201,
    description: 'Data cutting berhasil disimpan.',
  })
  @ApiResponse({ status: 400, description: 'Data tidak valid.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createCuttingDto: CreateCuttingDto) {
    return this.cuttingService.create(createCuttingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil semua data cutting' })
  @ApiResponse({
    status: 200,
    description: 'Daftar semua cutting records.',
    // schema: { type: 'array', items: { $ref: '#/components/schemas/CuttingRecord' } }
  })
  findAll() {
    return this.cuttingService.findAll();
  }
}
