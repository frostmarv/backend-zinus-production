// src/modules/production-order-item/production-order-item.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrderItem } from '../../entities/production-order-item.entity';

@Injectable()
export class ProductionOrderItemService {
  constructor(
    @InjectRepository(ProductionOrderItem)
    private poiRepo: Repository<ProductionOrderItem>,
  ) {}

  findAll(): Promise<ProductionOrderItem[]> {
    return this.poiRepo.find({
      relations: ['order', 'product'], // join untuk menampilkan relasi
    });
  }

  async findOne(id: number): Promise<ProductionOrderItem> {
    const item = await this.poiRepo.findOne({
      where: { item_id: id },
      relations: ['order', 'product'],
    });
    if (!item)
      throw new NotFoundException(
        `ProductionOrderItem dengan ID "${id}" tidak ditemukan`,
      );
    return item;
  }
}
