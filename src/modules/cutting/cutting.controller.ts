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
import { CreateProductionCuttingDto } from './dto/create-production-cutting.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

// 🔽 Import Google Sheets Service
import { GoogleSheetsService } from '../../services/google-sheets.service';

@ApiTags('Cutting Records')
@Controller('cutting')
export class CuttingController {
  constructor(
    private readonly cuttingService: CuttingService,
    private readonly sheetsService: GoogleSheetsService, // Inject service
  ) {}

  /**
   * Create a new cutting record with associated balok data → Sheet: "Balok"
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
  async create(@Body() dto: CreateCuttingDto) {
    // 1. Simpan ke database
    const result = await this.cuttingService.create(dto);

    // 2. Kirim ke Google Sheets: Sheet "Balok"
    try {
      const rows = dto.balok.map((b) => [
        new Date().toISOString(), // Timestamp
        dto.shift || '-', // Shift
        dto.group || '-', // Group
        dto.machine || '-', // Mesin
        dto.timeSlot?.split('-')[0].trim() || '-', // Jam mulai
        b.density || '-', // Plan: Density
        b.ild || '-', // Plan: ILD
        b.colour || '-', // Plan: Warna
        b.length || 0, // Plan: Panjang
        b.width || 0, // Plan: Lebar
        b.height || 0, // Plan: Tinggi
        b.sizeActual || '-', // Plan: Size Actual
        b.qtyBalok || 0, // Plan: Qty Balok
        '-', // Actual: Density (nanti bisa diisi dari actuals)
        '-', // Actual: ILD
        '-', // Actual: Warna
        '-', // Actual: Panjang
        '-', // Actual: Lebar
        '-', // Actual: Tinggi
        '-', // Actual: Qty Balok
        '-', // Actual: Qty Produksi
        dto.week || '-', // Week
      ]);

      await this.sheetsService.appendToDepartmentSheet('cutting', 'balok', rows);
    } catch (error) {
      console.warn('⚠️ Gagal kirim ke Google Sheets (Balok):', error.message);
      // Jangan hentikan proses — integrasi opsional
    }

    return result;
  }

  /**
   * Get all cutting records
   */
  @Get()
  @ApiOperation({ summary: 'Ambil semua data cutting records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daftar cutting records berhasil diambil.',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/CuttingRecord' },
    },
  })
  async findAll() {
    return await this.cuttingService.findAll();
  }

  /**
   * Create a new production cutting record → Sheet: "Summary"
   */
  @Post('production')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat data production cutting record baru (InputCutting)',
  })
  @ApiBody({ type: CreateProductionCuttingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Production cutting record berhasil dibuat.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Input tidak valid. Periksa struktur payload.',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createProductionCutting(@Body() dto: CreateProductionCuttingDto) {
    // 1. Simpan ke database
    const result = await this.cuttingService.createProductionCutting(dto);

    // 2. Kirim ke Google Sheets: Sheet "Summary"
    try {
      const rows = dto.entries.map((entry) => {
        // Remain akan dihitung di frontend/sheets, tidak disimpan di DB
        const simpleRemain = (entry.quantityOrder || 0) - (entry.quantityProduksi || 0);
        
        return [
          dto.timestamp, // Timestamp
          dto.shift, // Shift
          dto.group, // Group
          dto.time, // Time
          entry.customer || '-', // Customer
          entry.customerPO || '-', // PO Customer
          entry.poNumber || '-', // PO Internal
          entry.sku || '-', // SKU
          entry.sCode || '-', // S-Code
          entry.description || '-', // Description
          entry.quantityOrder || 0, // Qty Order
          entry.quantityProduksi || 0, // Qty Produksi
          simpleRemain, // Sisa (simple calculation untuk sheets)
          entry.week || '-', // Week
        ];
      });

      await this.sheetsService.appendToDepartmentSheet('cutting', 'summary', rows);
    } catch (error) {
      console.warn('⚠️ Gagal kirim ke Google Sheets (Summary):', error.message);
    }

    return result;
  }

  /**
   * Get all production cutting records
   */
  @Get('production')
  @ApiOperation({ summary: 'Ambil semua data production cutting records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daftar production cutting records berhasil diambil.',
  })
  async findAllProductionCutting() {
    return await this.cuttingService.findAllProductionCutting();
  }

  /**
   * Get single production cutting by ID
   */
  @Get('production/:id')
  @ApiOperation({
    summary: 'Ambil detail production cutting record berdasarkan ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID dari production cutting record',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detail ditemukan.' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tidak ditemukan.',
  })
  async findOneProductionCutting(@Param('id') id: string) {
    return await this.cuttingService.findOneProductionCutting(id);
  }

  /**
   * Update cutting record
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update data cutting record (boleh partial)' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID dari cutting record',
  })
  @ApiBody({ type: UpdateCuttingDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Berhasil diupdate.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Input tidak valid.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tidak ditemukan.',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateCuttingDto) {
    return await this.cuttingService.update(id, dto);
  }

  /**
   * Delete cutting record
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus data cutting record berdasarkan ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID dari cutting record',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Berhasil dihapus.' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tidak ditemukan.',
  })
  async remove(@Param('id') id: string) {
    return await this.cuttingService.remove(id);
  }

  /**
   * Delete production cutting record
   */
  @Delete('production/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hapus data production cutting record berdasarkan ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID dari production cutting record',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Berhasil dihapus.' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tidak ditemukan.',
  })
  async removeProductionCutting(@Param('id') id: string) {
    return await this.cuttingService.removeProductionCutting(id);
  }

  /**
   * Get single cutting record by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail cutting record berdasarkan ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID dari cutting record',
    example: 'a1b2c3d4...',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detail ditemukan.' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tidak ditemukan.',
  })
  async findOne(@Param('id') id: string) {
    return await this.cuttingService.findOne(id);
  }
}
