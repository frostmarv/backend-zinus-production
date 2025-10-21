import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { ProductionPlanningService } from './production-planning.service';
import {
  CreateProductionPlanningDto,
  UpdateProductionPlanningDto,
  UploadProductionPlanningDto,
} from './dto';

@Controller('production-planning')
export class ProductionPlanningController {
  constructor(private readonly planningService: ProductionPlanningService) {}

  @Get('foam')
  async getFoamPlanning() {
    return this.planningService.findAllFoam();
  }

  @Get('spring')
  async getSpringPlanning() {
    return this.planningService.findAllSpring();
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.planningService.findOneById(id);
  }

  @Post()
  async create(@Body() dto: CreateProductionPlanningDto) {
    return this.planningService.create(dto);
  }

  // 🔹 Upload massal JSON
  @Post('upload')
  async upload(@Body() dto: UploadProductionPlanningDto) {
    return this.planningService.upload(dto);
  }

  // 🔹 Upload file (Excel/CSV)
  @Post('upload-file')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    let data: any[] = [];

    if (
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.xlsx')
    ) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else if (
      file.mimetype === 'text/csv' ||
      file.originalname.endsWith('.csv')
    ) {
      data = await new Promise<any[]>((resolve, reject) => {
        const results: any[] = [];
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream
          .pipe(csvParser())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', (error) => reject(error));
      });
    } else {
      throw new BadRequestException(
        'Format file tidak didukung. Harap gunakan .xlsx atau .csv',
      );
    }

    // Group data berdasarkan PO (shipToName, customerPO, poNumber)
    const grouped = data.reduce(
      (acc, row) => {
        const key = `${row.shipToName}-${row.customerPO}-${row.poNumber}`;
        if (!acc[key]) {
          acc[key] = {
            shipToName: row.shipToName,
            customerPO: row.customerPO,
            poNumber: row.poNumber,
            orderDate: row.orderDate ? new Date(row.orderDate) : undefined,
            items: [],
          };
        }

        // ✅ Ambil langsung kolom `spec` dari file Excel/CSV
        const spec = row.spec?.toString()?.trim();
        if (!spec) {
          throw new BadRequestException(
            `Item dengan SKU "${row.sku}" harus memiliki kolom "spec" yang valid.`,
          );
        }

        // ✅ Validasi format spec sebelum kirim ke service
        const specRegex = /^(\d+\.?\d*)\s*\*\s*(\d+\.?\d*)\s*\*\s*(\d+\.?\d*)\s*([a-zA-Z]*)$/;
        if (!specRegex.test(spec)) {
          throw new BadRequestException(
            `Format "spec" tidak valid: "${spec}". Gunakan format: "Panjang*Lebar*Tinggi[Satuan]", contoh: "75*54*8IN"`,
          );
        }

        acc[key].items.push({
          itemNumber: row.itemNumber,
          sku: row.sku,
          category: row.category,
          spec, // ✅ kirim langsung sebagai string
          itemDescription: row.itemDescription,
          orderQty: row.orderQty,
          sample: row.sample || '0',
          week: row.week,
          iD: row.iD,
          lD: row.lD,
          sD: row.sD,
        });
        return acc;
      },
      {} as Record<string, any>,
    );

    const payloads = Object.values(grouped);

    const results = [];
    for (const payload of payloads) {
      results.push(
        await this.planningService.upload(
          payload as UploadProductionPlanningDto,
        ),
      );
    }

    return results;
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionPlanningDto,
  ) {
    return this.planningService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.planningService.delete(id);
  }
}