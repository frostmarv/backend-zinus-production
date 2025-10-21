// src/modules/production-planning/production-planning.controller.ts

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
      // ✅ Baca data mentah dan bersihkan header
      const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: '' });

      data = rawData.map((row: any) => {
        const cleaned: any = {};
        Object.keys(row).forEach((key) => {
          // ✅ Bersihkan spasi di header
          const cleanKey = key.trim().replace(/\s+/g, ' ');
          cleaned[cleanKey] = row[key];
        });
        return cleaned;
      });
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

    // Helper: Parse number dari string (misalnya "1,560" → 1560)
    const parseNumber = (value: any): number => {
      if (value === null || value === undefined || value === '') return 0;
      const cleaned = String(value).replace(/[^0-9.-]/g, '');
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    };

    // Helper: Parse date dari string
    const parseDate = (value: any): Date | null => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    // Group data berdasarkan PO (shipToName, customerPO, poNumber)
    const grouped = data.reduce(
      (acc, row) => {
        // ✅ Mapping field dari header Excel ke DTO (dengan header yang sudah dibersihkan)
        const shipToName = row['shipToName'] || row['Ship to Name'];
        const customerPO = row['customerPO'] || row['Cust. PO'];
        const poNumber = row['poNumber'] || row['PO No.'];
        const itemNumber = row['itemNumber'] || row['Item Number'];
        const sku = row['sku'] || row['SKU'];
        const spec = row['spec'] || row['Spec'];
        const itemDescription = row['itemDescription'] || row['Item Description'];
        const iD = row['iD'] || row['I/D'];
        const lD = row['lD'] || row['L/D'];
        const sD = row['sD'] || row['S/D'];
        const orderQty = row['orderQty'] || row['Order QTY'] || row['Order Qty'] || row['Qty'];
        const sample = row['sample'] || row['Sample'];
        const week = row['week'] || row['Week'];
        const category = row['category'] || row['Category'];

        // Validasi wajib
        if (!shipToName) throw new BadRequestException('Kolom "shipToName" wajib diisi.');
        if (!customerPO) throw new BadRequestException('Kolom "customerPO" wajib diisi.');
        if (!poNumber) throw new BadRequestException('Kolom "poNumber" wajib diisi.');
        if (!itemNumber) throw new BadRequestException('Kolom "itemNumber" wajib diisi.');
        if (!sku) throw new BadRequestException('Kolom "sku" wajib diisi.');
        if (!spec) throw new BadRequestException('Kolom "spec" wajib diisi.');

        const key = `${shipToName}-${customerPO}-${poNumber}`;
        if (!acc[key]) {
          acc[key] = {
            shipToName,
            customerPO,
            poNumber,
            orderDate: row.orderDate ? new Date(row.orderDate) : undefined,
            items: [],
          };
        }

        // Validasi format spec
        const specRegex = /^(\d+\.?\d*)\s*\*\s*(\d+\.?\d*)\s*\*\s*(\d+\.?\d*)\s*([a-zA-Z]*)$/;
        if (!specRegex.test(spec?.toString()?.trim())) {
          throw new BadRequestException(
            `Format "spec" tidak valid: "${spec}". Gunakan format: "Panjang*Lebar*Tinggi[Satuan]", contoh: "75*54*8IN"`,
          );
        }

        acc[key].items.push({
          itemNumber,
          sku,
          category: category?.toString()?.trim() || 'FOAM',
          spec: spec.toString().trim(),
          itemDescription: itemDescription?.toString()?.trim() || '',
          orderQty: parseNumber(orderQty),
          sample: parseNumber(sample),
          week: parseNumber(week),
          iD: parseDate(iD),
          lD: parseDate(lD),
          sD: parseDate(sD),
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