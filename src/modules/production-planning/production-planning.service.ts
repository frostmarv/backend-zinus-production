// src/modules/production-planning/production-planning.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductionOrderItem } from '../../entities/production-order-item.entity';
import { ProductionOrder } from '../../entities/production-order.entity';
import { Product } from '../../entities/product.entity';
import { Customer } from '../../entities/customer.entity';
import {
  CreateProductionPlanningDto,
  UploadProductionPlanningDto, // 👈 tambahkan
  UpdateProductionPlanningDto, // 👈 tambahkan
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

  // 🔹 BARU: Ambil data foam
  async findAllFoam() {
    return this.getPlanningByCategory('FOAM');
  }

  // 🔹 BARU: Ambil data spring
  async findAllSpring() {
    return this.getPlanningByCategory('SPRING');
  }

  // 🔹 BARU: Query data berdasarkan kategori
  private async getPlanningByCategory(category: string) {
    const query = `
      SELECT 
        c.customer_name AS "Ship to Name",
        po.customer_po AS "Cust. PO",
        po.po_number AS "PO No.",
        p.item_number AS "Item Number",
        p.sku AS "SKU",
        p.spec_length || '*' || p.spec_width || '*' || p.spec_height || p.spec_unit AS "Spec",
        p.item_description AS "Item Description",
        poi.i_d AS "I/D",
        poi.l_d AS "L/D",
        poi.s_d AS "S/D",
        poi.planned_qty AS "Order QTY",
        poi.sample_qty AS "Sample",
        (poi.planned_qty + COALESCE(poi.sample_qty, 0)) AS "Total Qty",
        poi.week_number AS "Week",
        p.category AS "Category"
      FROM production_order_items poi
      JOIN production_orders po ON poi.orderOrderId = po.order_id
      JOIN customers c ON po.customerCustomerId = c.customer_id
      JOIN products p ON poi.productProductId = p.product_id
      WHERE p.category = ?
      ORDER BY po.po_number, poi.week_number
    `;
    return this.dataSource.query(query, [category]);
  }

  async findOneById(id: number) {
    const item = await this.itemRepo.findOne({
      where: { itemId: id },
      relations: ['order', 'order.customer', 'product'],
    });
    if (!item) throw new NotFoundException(`Item with ID ${id} not found`);
    return this.formatItemResponse(item);
  }

  // 🔹 BARU: Update item
  async update(id: number, dto: UpdateProductionPlanningDto) {
    const item = await this.itemRepo.findOne({
      where: { itemId: id },
      relations: ['order', 'product'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    // Update item
    if (dto.orderQty !== undefined) item.plannedQty = dto.orderQty;
    if (dto.sample !== undefined) item.sampleQty = dto.sample;
    if (dto.week !== undefined) item.weekNumber = parseInt(dto.week, 10);
    if (dto.iD !== undefined) item.iD = dto.iD ? new Date(dto.iD) : null;
    if (dto.lD !== undefined) item.lD = dto.lD ? new Date(dto.lD) : null;
    if (dto.sD !== undefined) item.sD = dto.sD ? new Date(dto.sD) : null;

    await this.itemRepo.save(item);
    return this.findOneById(id);
  }

  // 🔹 BARU: Delete item
  async delete(id: number) {
    const item = await this.itemRepo.findOne({
      where: { itemId: id },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    await this.itemRepo.remove(item);
    return { message: `Item with ID ${id} has been deleted` };
  }

  // 🔹 Upload massal
  async upload(dto: UploadProductionPlanningDto) {
    // 1. Cari atau buat CUSTOMER
    let customer = await this.customerRepo.findOne({
      where: { customerName: dto.shipToName },
    });

    if (!customer) {
      const customerCode = this.generateCustomerCode(dto.shipToName);
      customer = this.customerRepo.create({
        customerName: dto.shipToName,
        customerCode,
      });
      await this.customerRepo.save(customer);
    }

    // 2. Cari atau buat PRODUCTION ORDER
    let order = await this.orderRepo.findOne({
      where: {
        poNumber: dto.poNumber,
        customerPo: dto.customerPO,
        customer: { customerId: customer.customerId },
      },
    });

    if (!order) {
      order = this.orderRepo.create({
        poNumber: dto.poNumber,
        customerPo: dto.customerPO,
        customer,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
      });
      await this.orderRepo.save(order);
    }

    // 3. Proses semua item
    const results = [];
    const errors = [];

    for (const [index, itemDto] of dto.items.entries()) {
      try {
        // a. Cari atau buat PRODUCT
        let product = await this.productRepo.findOne({
          where: { sku: itemDto.sku },
        });

        if (!product) {
          product = this.productRepo.create({
            itemNumber: itemDto.itemNumber,
            sku: itemDto.sku,
            category: itemDto.category.trim().toUpperCase(),
            specLength: itemDto.specLength,
            specWidth: itemDto.specWidth,
            specHeight: itemDto.specHeight,
            specUnit: itemDto.specUnit,
            itemDescription: itemDto.itemDescription,
          });
          await this.productRepo.save(product);
        }

        // b. Buat PRODUCTION ORDER ITEM
        const item = this.itemRepo.create({
          order,
          product,
          iD: itemDto.iD ? new Date(itemDto.iD) : null,
          lD: itemDto.lD ? new Date(itemDto.lD) : null,
          sD: itemDto.sD ? new Date(itemDto.sD) : null,
          plannedQty: itemDto.orderQty,
          sampleQty: itemDto.sample || 0,
          weekNumber: parseInt(itemDto.week, 10) || 1,
        });

        const savedItem = await this.itemRepo.save(item);
        results.push(this.formatItemResponse(savedItem));
      } catch (error) {
        errors.push({
          index: index + 1,
          item: itemDto.sku,
          error: error.message || 'Gagal menyimpan item',
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

  // 🔹 Create (satu item)
  async create(dto: CreateProductionPlanningDto) {
    return this.upload({
      shipToName: dto.shipToName,
      customerPO: dto.customerPO,
      poNumber: dto.poNumber,
      items: [
        {
          itemNumber: dto.itemNumber,
          sku: dto.sku,
          category: dto.category,
          specLength: dto.specLength,
          specWidth: dto.specWidth,
          specHeight: dto.specHeight,
          specUnit: dto.specUnit,
          itemDescription: dto.itemDescription,
          iD: dto.iD,
          lD: dto.lD,
          sD: dto.sD,
          orderQty: dto.orderQty,
          sample: dto.sample,
          week: dto.week,
        },
      ],
    });
  }

  private generateCustomerCode(name: string): string {
    return (
      name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10) || 'CUST001'
    );
  }

  private formatItemResponse(item: ProductionOrderItem) {
    const spec =
      item.product.specLength &&
      item.product.specWidth &&
      item.product.specHeight
        ? `${item.product.specLength}*${item.product.specWidth}*${item.product.specHeight}${item.product.specUnit}`
        : '';

    return {
      'Ship to Name': item.order.customer.customerName,
      'Cust. PO': item.order.customerPo,
      'PO No.': item.order.poNumber,
      'Item Number': item.product.itemNumber,
      SKU: item.product.sku,
      Spec: spec,
      'Item Description': item.product.itemDescription,
      'I/D': item.iD,
      'L/D': item.lD,
      'S/D': item.sD,
      'Order QTY': item.plannedQty,
      Sample: item.sampleQty,
      'Total Qty': item.plannedQty + (item.sampleQty || 0),
      Week: item.weekNumber,
      Category: item.product.category,
    };
  }
}
