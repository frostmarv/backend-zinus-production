// src/modules/production-order-item/production-order-item.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrderItem } from '../../entities/production-order-item.entity';
import { ProductionOrder } from '../../entities/production-order.entity';
import { Product } from '../../entities/product.entity';

@Injectable()
export class ProductionOrderItemService {
  constructor(
    @InjectRepository(ProductionOrderItem)
    private poiRepo: Repository<ProductionOrderItem>,
  ) {}

  findAll(): Promise<ProductionOrderItem[]> {
    return this.poiRepo.find({
      relations: ['order', 'product'],
    });
  }

  async findOne(id: number): Promise<ProductionOrderItem> {
    const item = await this.poiRepo.findOne({
      where: { itemId: id },
      relations: ['order', 'product'],
    });
    if (!item) {
      throw new NotFoundException(
        `ProductionOrderItem dengan ID "${id}" tidak ditemukan`,
      );
    }
    return item;
  }

  async create(createDto: {
    order: ProductionOrder;
    product: Product;
    plannedQty: number;
    sampleQty?: number;
    weekNumber: number;
    iD?: Date | null;
    lD?: Date | null;
    sD?: Date | null;
  }): Promise<ProductionOrderItem> {
    const item = this.poiRepo.create({
      ...createDto,
      sampleQty: createDto.sampleQty ?? 0,
    });
    return await this.poiRepo.save(item);
  }
}