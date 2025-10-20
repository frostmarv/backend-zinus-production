// src/modules/products/product.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';

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

  async create(createDto: {
    itemNumber: string;
    sku: string;
    category: string;
    specLength: number;
    specWidth: number;
    specHeight: number;
    specUnit: string;
    itemDescription: string;
  }): Promise<Product> {
    const existing = await this.findBySku(createDto.sku);
    if (existing) {
      throw new BadRequestException(
        `Product dengan SKU "${createDto.sku}" sudah ada`,
      );
    }
    const product = this.productRepo.create(createDto);
    return await this.productRepo.save(product);
  }
}