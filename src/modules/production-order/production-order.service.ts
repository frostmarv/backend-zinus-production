// src/modules/production-order/production-order.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrder } from '../../entities/production-order.entity';
import { Customer } from '../../entities/customer.entity';

@Injectable()
export class ProductionOrderService {
  constructor(
    @InjectRepository(ProductionOrder)
    private orderRepo: Repository<ProductionOrder>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  findAll(): Promise<ProductionOrder[]> {
    return this.orderRepo.find({ relations: ['customer'] });
  }

  async findOne(id: number): Promise<ProductionOrder> {
    const order = await this.orderRepo.findOne({
      where: { orderId: id },
      relations: ['customer'],
    });
    if (!order) {
      throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan`);
    }
    return order;
  }

  async findByPoAndCustomer(
    poNumber: string,
    customerPo: string,
    customerId: number,
  ): Promise<ProductionOrder | null> {
    return this.orderRepo.findOne({
      where: { poNumber, customerPo, customer: { customerId } },
    });
  }

  async create(
    customerId: number,
    customerPo: string,
    poNumber: string,
    orderDate?: Date,
  ): Promise<ProductionOrder> {
    const customer = await this.customerRepo.findOne({
      where: { customerId },
    });

    if (!customer) {
      throw new BadRequestException(
        `Customer dengan ID ${customerId} tidak ditemukan`,
      );
    }

    const existing = await this.findByPoAndCustomer(
      poNumber,
      customerPo,
      customerId,
    );
    if (existing) {
      return existing;
    }

    const order = this.orderRepo.create({
      poNumber,
      customerPo,
      customer,
      orderDate: orderDate || new Date(),
    });
    return await this.orderRepo.save(order);
  }

  async update(
    id: number,
    data: Partial<ProductionOrder>,
  ): Promise<ProductionOrder> {
    const order = await this.findOne(id);
    Object.assign(order, data);
    return await this.orderRepo.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepo.remove(order);
  }
}