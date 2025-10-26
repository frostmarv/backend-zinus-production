import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadProductsDto } from './dto/upload-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.productRepo.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { productId: id },
    });
    if (!product) {
      throw new NotFoundException(`Product dengan ID "${id}" tidak ditemukan`);
    }
    return product;
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.productRepo.findOne({ where: { sku } });
  }

  async create(createDto: CreateProductDto): Promise<Product> {
    const existing = await this.findBySku(createDto.sku);
    if (existing) {
      throw new BadRequestException(
        `Product dengan SKU "${createDto.sku}" sudah ada`,
      );
    }
    const product = this.productRepo.create(createDto);
    return this.productRepo.save(product);
  }

  async update(id: number, updateDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    // Cek duplikasi SKU jika diubah
    if (updateDto.sku && updateDto.sku !== product.sku) {
      const existing = await this.findBySku(updateDto.sku);
      if (existing) {
        throw new BadRequestException(
          `SKU "${updateDto.sku}" sudah digunakan oleh produk lain`,
        );
      }
    }
    Object.assign(product, updateDto);
    return this.productRepo.save(product);
  }

  async remove(id: number): Promise<void> {
    // Opsional: cegah hapus jika dipakai di AssemblyLayer atau ProductionOrder
    const product = await this.productRepo.findOne({
      where: { productId: id },
      relations: ['assemblyLayers'],
    });

    if (!product) {
      throw new NotFoundException(`Product dengan ID ${id} tidak ditemukan`);
    }

    // Jika ingin aman total, cegah hapus jika ada relasi
    // if (product.assemblyLayers?.length > 0) {
    //   throw new BadRequestException('Tidak bisa menghapus produk yang memiliki Assembly Layer');
    // }

    const result = await this.productRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product dengan ID ${id} tidak ditemukan`);
    }
  }

  // 🔹 Upload massal (JSON)
  async upload(dto: UploadProductsDto) {
    const results = [];
    const errors = [];

    for (const [index, productDto] of dto.products.entries()) {
      try {
        const product = await this.create(productDto);
        results.push(product);
      } catch (error) {
        errors.push({
          index: index + 1,
          sku: productDto.sku,
          error: error.message || 'Gagal menyimpan produk',
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
}