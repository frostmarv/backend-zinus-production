// src/modules/assembly-layers/assembly-layers.controller.ts
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
import csvParser from 'csv-parser'; // 🔴 Perbaikan: default import
import { Readable } from 'stream';
import { AssemblyLayersService } from './assembly-layers.service';
import { CreateAssemblyLayerDto } from './dto/create-assembly-layer.dto';
import { UpdateAssemblyLayerDto } from './dto/update-assembly-layer.dto';
import { UploadAssemblyLayersDto } from './dto/upload-assembly-layer.dto'; // 🔴 Perbaikan: path file

@Controller('assembly-layers')
export class AssemblyLayersController {
  constructor(private readonly service: AssemblyLayersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAssemblyLayerDto) {
    return this.service.create(dto);
  }

  // 🔹 Upload massal JSON
  @Post('upload')
  upload(@Body() dto: UploadAssemblyLayersDto) {
    return this.service.upload(dto);
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

    let data: any[] = []; // ✅ Perbaikan: tambahkan nama variabel

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
      data = await new Promise((resolve, reject) => {
        const results: any[] = [];
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream
          .pipe(csvParser())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', (error) => reject(error));
      });
    } else {
      throw new BadRequestException(
        'Format file tidak didukung. Harap gunakan .xlsx atau .csv',
      );
    }

    const layers = data.map((row) => ({
      product_sku: row['product_sku'] || row['sku'] || row['SKU'],
      second_item_number: row['second_item_number'] || row['secondItemNumber'],
      description: row['description'],
      description_line_2: row['description_line_2'] || row['descriptionLine2'],
      layer_index:
        row['layer_index'] || row['layerIndex']
          ? parseInt(row['layer_index'] || row['layerIndex'], 10)
          : null,
      category_layers: row['category_layers'] || row['categoryLayers'] || null,
    }));

    if (
      !layers.every(
        (l) => l.product_sku && l.second_item_number && l.description,
      )
    ) {
      throw new BadRequestException(
        'Kolom product_sku, second_item_number, dan description wajib diisi di setiap baris.',
      );
    }

    return this.service.upload({ layers });
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssemblyLayerDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
