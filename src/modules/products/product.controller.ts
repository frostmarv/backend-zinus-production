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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadProductsDto } from './dto/upload-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  // 🔹 Upload massal JSON
  @Post('upload')
  upload(@Body() dto: UploadProductsDto) {
    return this.productService.upload(dto);
  }

  // 🔹 Upload file Excel/CSV
  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    let data: any[] = [];

    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.xlsx')
    ) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      data = await new Promise((resolve, reject) => {
        const results: any[] = [];
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream
          .pipe(csvParser())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      throw new BadRequestException('Format file tidak didukung. Harap gunakan .xlsx atau .csv');
    }

    const products = data.map((row) => ({
      itemNumber: row['itemNumber'] || row['Item Number'] || row['item_number'],
      sku: row['sku'] || row['SKU'],
      category: (row['category'] || row['Category'] || '').trim().toUpperCase(),
      spec: row['spec'] || row['Spec'],
      itemDescription: row['itemDescription'] || row['Item Description'] || row['item_description'],
    }));

    if (!products.every((p) => p.itemNumber && p.sku && p.category && p.spec && p.itemDescription)) {
      throw new BadRequestException(
        'Kolom wajib: itemNumber, sku, category, spec, itemDescription harus diisi di setiap baris.',
      );
    }

    return this.productService.upload({ products });
  }
}