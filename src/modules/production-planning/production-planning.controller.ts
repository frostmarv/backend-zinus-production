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

  @Post('upload')
  async upload(@Body() dto: UploadProductionPlanningDto) {
    return this.planningService.upload(dto);
  }

  // 🔹 Upload file (Excel/CSV) — REVISI LENGKAP
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
      const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true }); // ✅ cellDates: true → otomatis konversi ke Date
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // Baca sebagai JSON dengan header mentah
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // ✅ false → gunakan nilai terformat (termasuk tanggal jadi Date object)
        defval: '',
        header: 1,
      });

      // Ambil header dari baris pertama
      if (rawData.length === 0) {
        throw new BadRequestException('File kosong');
      }

      const headers = rawData[0] as string[];
      data = rawData.slice(1).map((row: any[]) => {
        const obj: Record<string, any> = {};
        headers.forEach((header, index) => {
          if (header && typeof header === 'string') {
            const cleanHeader = header.trim().replace(/\s+/g, ' ');
            obj[cleanHeader] = row[index] ?? '';
          }
        });
        return obj;
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

    // ✅ Helper: Parse tanggal dengan aman (dari Date object, string ISO, atau string biasa)
    const safeParseDate = (value: any): Date | null => {
      if (value == null || value === '' || value === undefined) return null;

      // Jika sudah Date object (dari XLSX dengan cellDates: true)
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
      }

      // Jika string
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;

        // Coba parse sebagai ISO atau format umum
        const date = new Date(trimmed);
        return isNaN(date.getTime()) ? null : date;
      }

      // Jika angka (misal: Excel serial number yang gagal terbaca)
      if (typeof value === 'number') {
        // Excel serial: 1 = 1900-01-01 (tapi XLSX biasanya handle ini otomatis)
        // Jika masih muncul, konversi manual:
        const date = new Date((value - 25569) * 86400 * 1000); // Excel ke Unix
        return isNaN(date.getTime()) ? null : date;
      }

      return null;
    };

    // Helper: Parse number dari string (misalnya "1,560" → 1560)
    const parseNumber = (value: any): number => {
      if (value == null || value === '' || value === undefined) return 0;
      if (typeof value === 'number') return value;
      const cleaned = String(value).replace(/[^0-9.-]/g, '');
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    };

    // Group data berdasarkan PO
    const grouped = data.reduce(
      (acc, row) => {
        const shipToName =
          row['shipToName'] ||
          row['Ship to Name'] ||
          row['ShipToName'] ||
          '';
        const customerPO =
          row['customerPO'] || row['Cust. PO'] || row['Customer PO'] || '';
        const poNumber = row['poNumber'] || row['PO No.'] || row['PONumber'] || '';
        const itemNumber =
          row['itemNumber'] || row['Item Number'] || row['ItemNumber'] || '';
        const sku = row['sku'] || row['SKU'] || '';
        const spec = row['spec'] || row['Spec'] || '';
        const itemDescription =
          row['itemDescription'] ||
          row['Item Description'] ||
          row['ItemDescription'] ||
          '';
        const iD = row['iD'] || row['I/D'] || row['ID'] || '';
        const lD = row['lD'] || row['L/D'] || row['LD'] || '';
        const sD = row['sD'] || row['S/D'] || row['SD'] || '';
        const orderQty =
          row['orderQty'] ||
          row['Order QTY'] ||
          row['Order Qty'] ||
          row['Qty'] ||
          0;
        const sample = row['sample'] || row['Sample'] || 0;
        const week = row['week'] || row['Week'] || 1;
        const category = row['category'] || row['Category'] || 'FOAM';

        // Validasi wajib
        if (!shipToName?.toString().trim())
          throw new BadRequestException('Kolom "Ship to Name" wajib diisi.');
        if (!customerPO?.toString().trim())
          throw new BadRequestException('Kolom "Cust. PO" wajib diisi.');
        if (!poNumber?.toString().trim())
          throw new BadRequestException('Kolom "PO No." wajib diisi.');
        if (!itemNumber?.toString().trim())
          throw new BadRequestException('Kolom "Item Number" wajib diisi.');
        if (!sku?.toString().trim())
          throw new BadRequestException('Kolom "SKU" wajib diisi.');
        if (!spec?.toString().trim())
          throw new BadRequestException('Kolom "Spec" wajib diisi.');

        const key = `${shipToName}-${customerPO}-${poNumber}`;
        if (!acc[key]) {
          acc[key] = {
            shipToName: shipToName.toString().trim(),
            customerPO: customerPO.toString().trim(),
            poNumber: poNumber.toString().trim(),
            orderDate: undefined,
            items: [],
          };
        }

        // Validasi format spec
        const specStr = spec.toString().trim();
        const specRegex = /^(\d+\.?\d*)\s*\*\s*(\d+\.?\d*)\s*\*\s*(\d+\.?\d*)\s*([a-zA-Z]*)$/;
        if (!specRegex.test(specStr)) {
          throw new BadRequestException(
            `Format "spec" tidak valid: "${specStr}". Gunakan format: "Panjang*Lebar*Tinggi[Satuan]", contoh: "75*54*8IN"`,
          );
        }

        acc[key].items.push({
          itemNumber: itemNumber.toString().trim(),
          sku: sku.toString().trim(),
          category: category.toString().trim() || 'FOAM',
          spec: specStr,
          itemDescription: itemDescription?.toString().trim() || '',
          orderQty: parseNumber(orderQty),
          sample: parseNumber(sample),
          week: parseNumber(week),
          iD: safeParseDate(iD),
          lD: safeParseDate(lD),
          sD: safeParseDate(sD),
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