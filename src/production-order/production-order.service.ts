import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrder } from './production-order.entity';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';

@Injectable()
export class ProductionOrderService {
  constructor(
    @InjectRepository(ProductionOrder)
    private orderRepo: Repository<ProductionOrder>,
  ) {}

  async create(dto: CreateProductionOrderDto) {
    const order = this.orderRepo.create(dto);
    return await this.orderRepo.save(order);
  }

  async findAll() {
    return await this.orderRepo.find();
  }
}