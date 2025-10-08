// src/modules/production-order/production-order.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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

  // Get all orders
  findAll(): Promise<ProductionOrder[]> {
    return this.orderRepo.find({ relations: ['customer'] });
  }

  // Get one order by ID
  async findOne(id: number): Promise<ProductionOrder> {
    const order = await this.orderRepo.findOne({
      where: { order_id: id },
      relations: ['customer'],
    });
    if (!order)
      throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan`);
    return order;
  }

  // Create new order
  async create(data: {
    customer_id: number;
    customer_po: string;
    po_number: string;
    order_date?: Date;
    status?: string;
  }): Promise<ProductionOrder> {
    const customer = await this.customerRepo.findOneBy({
      customer_id: data.customer_id,
    });
    if (!customer)
      throw new NotFoundException(
        `Customer dengan ID "${data.customer_id}" tidak ditemukan`,
      );

    const order = this.orderRepo.create({
      customer,
      customer_po: data.customer_po,
      po_number: data.po_number,
      order_date: data.order_date,
      status: data.status || 'confirmed',
    });

    return this.orderRepo.save(order);
  }

  // Update order
  async update(
    id: number,
    data: Partial<ProductionOrder>,
  ): Promise<ProductionOrder> {
    const order = await this.findOne(id);
    if (data.customer) order.customer = data.customer;
    if (data.customer_po !== undefined) order.customer_po = data.customer_po;
    if (data.po_number !== undefined) order.po_number = data.po_number;
    if (data.order_date !== undefined) order.order_date = data.order_date;
    if (data.status !== undefined) order.status = data.status;

    return this.orderRepo.save(order);
  }

  // Delete order
  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepo.remove(order);
  }
}
