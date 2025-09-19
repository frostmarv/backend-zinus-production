// src/modules/cutting/cutting.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CuttingService } from './cutting.service';
import { CreateCuttingDto } from './dto/create-cutting.dto';
import { UpdateCuttingDto } from './dto/update-cutting.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Cutting Records')
@Controller('api/cutting')
export class CuttingController {
  constructor(private readonly cuttingService: CuttingService) {}

  /**
   * Create a new cutting record with associated balok data
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat data cutting record baru' })
  @ApiBody({ type: CreateCuttingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cutting record berhasil dibuat.',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
        timestamp: '2025-06-01T08:00:00',
        shift: 'Shift Pagi',
        group: 'Group A',
        machine: 'MESIN-01',
        timeSlot: '08:00 - 16:00',
        week: 'W24',
        foamingDate: {
          isChecked: true,
          tanggalSelesai: '2025-06-01',
          jam: '14:00',
        },
        balok: [
          {
            density: 30,
            ild: 120,
            colour: 'Merah',
            length: 100,
            width: 50,
            height: 20,
            sizeActual: '100x50x20',
            qtyBalok: 5,
          },
        ],
        createdAt: '2025-06-01T08:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Input tidak valid. Periksa struktur payload.',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createCuttingDto: CreateCuttingDto) {
    return await this.cuttingService.create(createCuttingDto);
  }

  /**
   * Get all cutting records with balok relations
   */
  @Get()
  @ApiOperation({ summary: 'Ambil semua data cutting records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daftar cutting records berhasil diambil.',
    schema: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/CuttingRecord',
      },
    },
  })
  async findAll() {
    return await this.cuttingService.findAll();
  }

  /**
   * Get a single cutting record by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail cutting record berdasarkan ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID dari cutting record',
    example: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detail cutting record ditemukan.',
    schema: {
      $ref: '#/components/schemas/CuttingRecord',
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cutting record dengan ID tersebut tidak ditemukan.',
  })
  async findOne(@Param('id') id: string) {
    return await this.cuttingService.findOne(id);
  }

  /**
   * Update a cutting record by ID (full or partial)
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update data cutting record (boleh partial)' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID dari cutting record',
    example: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
  })
  @ApiBody({ type: UpdateCuttingDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data cutting record berhasil diupdate.',
    schema: {
      $ref: '#/components/schemas/CuttingRecord',
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Data input tidak valid.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cutting record tidak ditemukan.',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id') id: string,
    @Body() updateCuttingDto: UpdateCuttingDto,
  ) {
    return await this.cuttingService.update(id, updateCuttingDto);
  }

  /**
   * Delete a cutting record by ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus data cutting record berdasarkan ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID dari cutting record',
    example: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data cutting record berhasil dihapus.',
    schema: {
      example: {
        message: 'Cutting record dengan ID "a1b2c3d4..." berhasil dihapus',
        id: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cutting record tidak ditemukan.',
  })
  async remove(@Param('id') id: string) {
    return await this.cuttingService.remove(id);
  }
}
