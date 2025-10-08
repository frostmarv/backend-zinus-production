import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductionOrderItem } from '../../entities/production-order-item.entity';
import { ProductionOrder } from '../../entities/production-order.entity';
import { Product } from '../../entities/product.entity';
import { Customer } from '../../entities/customer.entity';
import {
  CreateProductionPlanningDto,
  UpdateProductionPlanningDto,
} from './dto';

@Injectable()
export class ProductionPlanningService {
  constructor(
    @InjectRepository(ProductionOrderItem)
    private itemRepo: Repository<ProductionOrderItem>,
    @InjectRepository(ProductionOrder)
    private orderRepo: Repository<ProductionOrder>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private dataSource: DataSource,
  ) {}

  async findAllFoam() {
    const query = `
      SELECT * FROM v_production_planning_foam
      ORDER BY "PO No.", "Week"
    `;
    return this.dataSource.query(query);
  }

  async findAllSpring() {
    const query = `
      SELECT * FROM v_production_planning_spring
      ORDER BY "PO No.", "Week"
    `;
    return this.dataSource.query(query);
  }

  async findOneById(id: number) {
    const item = await this.itemRepo.findOne({
      where: { item_id: id },
      relations: ['order', 'order.customer', 'product'],
    });

    if (!item) {
      throw new NotFoundException(`Production planning item with ID ${id} not found`);
    }

    return this.formatItemResponse(item);
  }

  async create(dto: CreateProductionPlanningDto) {
    const customer = await this.customerRepo.findOne({
      where: { customer_name: dto.shipToName },
    });

    if (!customer) {
      throw new NotFoundException(`Customer '${dto.shipToName}' not found`);
    }

    let order = await this.orderRepo.findOne({
      where: {
        po_number: dto.poNumber,
        customer_po: dto.customerPO,
      },
    });

    if (!order) {
      order = this.orderRepo.create({
        po_number: dto.poNumber,
        customer_po: dto.customerPO,
        customer: customer,
      });
      await this.orderRepo.save(order);
    }

    const product = await this.productRepo.findOne({
      where: { sku: dto.sku },
    });

    if (!product) {
      throw new NotFoundException(`Product with SKU '${dto.sku}' not found`);
    }

    const item = this.itemRepo.create({
      order: order,
      product: product,
      i_d: dto.iD ? new Date(dto.iD) : null,
      l_d: dto.lD ? new Date(dto.lD) : null,
      s_d: dto.sD ? new Date(dto.sD) : null,
      planned_qty: dto.orderQty,
      sample_qty: dto.sample || 0,
      week_number: parseInt(dto.week, 10),
    });

    const savedItem = await this.itemRepo.save(item);
    return this.findOneById(savedItem.item_id);
  }

  async update(id: number, dto: UpdateProductionPlanningDto) {
    const item = await this.itemRepo.findOne({
      where: { item_id: id },
      relations: ['order', 'product'],
    });

    if (!item) {
      throw new NotFoundException(`Production planning item with ID ${id} not found`);
    }

    if (dto.iD !== undefined) item.i_d = dto.iD ? new Date(dto.iD) : null;
    if (dto.lD !== undefined) item.l_d = dto.lD ? new Date(dto.lD) : null;
    if (dto.sD !== undefined) item.s_d = dto.sD ? new Date(dto.sD) : null;
    if (dto.orderQty !== undefined) item.planned_qty = dto.orderQty;
    if (dto.sample !== undefined) item.sample_qty = dto.sample;
    if (dto.week !== undefined) item.week_number = parseInt(dto.week, 10);

    await this.itemRepo.save(item);
    return this.findOneById(id);
  }

  async delete(id: number) {
    const item = await this.itemRepo.findOne({
      where: { item_id: id },
    });

    if (!item) {
      throw new NotFoundException(`Production planning item with ID ${id} not found`);
    }

    await this.itemRepo.remove(item);
    return { message: 'Production planning item deleted successfully' };
  }

  private formatItemResponse(item: ProductionOrderItem) {
    const spec = item.product.spec_length && item.product.spec_width && item.product.spec_height
      ? `${item.product.spec_length}*${item.product.spec_width}*${item.product.spec_height}${item.product.spec_unit}`
      : '';

    return {
      'Ship to Name': item.order.customer.customer_name,
      'Cust. PO': item.order.customer_po,
      'PO No.': item.order.po_number,
      'Item Number': item.product.item_number,
      SKU: item.product.sku,
      Spec: spec,
      'Item Description': item.product.item_description,
      'I/D': item.i_d,
      'L/D': item.l_d,
      'S/D': item.s_d,
      'Order QTY': item.planned_qty,
      Sample: item.sample_qty,
      'Total Qty': item.total_planned,
      Week: item.week_number,
      Category: item.product.category,
    };
  }
}
