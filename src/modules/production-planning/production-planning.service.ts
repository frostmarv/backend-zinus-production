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
  UploadProductionPlanningDto,
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
    return this.getPlanningByCategory('FOAM');
  }

  async findAllSpring() {
    return this.getPlanningByCategory('SPRING');
  }

  private async getPlanningByCategory(category: string) {
    const query = `
      SELECT 
        poi.item_id AS "id",
        c.customer_name AS "Ship to Name",
        po.customer_po AS "Cust. PO",
        po.po_number AS "PO No.",
        p.item_number AS "Item Number",
        p.sku AS "SKU",
        p.spec AS "Spec",
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
      JOIN production_orders po ON poi.order_order_id = po.order_id
      JOIN customers c ON po.customer_customer_id = c.customer_id
      JOIN products p ON poi.product_product_id = p.product_id
      WHERE p.category = $1
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

  private parseInteger(value: string | number | undefined, fieldName: string): number {
    if (value === undefined || value === null) {
      return 0;
    }
    if (typeof value === 'number') {
      return value;
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new BadRequestException(`Nilai "${fieldName}" harus berupa angka, ditemukan: "${value}"`);
    }
    return num;
  }

  async update(id: number, dto: UpdateProductionPlanningDto) {
    const item = await this.itemRepo.findOne({
      where: { itemId: id },
      relations: ['order', 'product'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    if (dto.orderQty !== undefined) item.plannedQty = this.parseInteger(dto.orderQty, 'orderQty');
    if (dto.sample !== undefined) item.sampleQty = this.parseInteger(dto.sample, 'sample');
    if (dto.week !== undefined) item.weekNumber = this.parseInteger(dto.week, 'week');

    if (dto.iD !== undefined) item.iD = dto.iD ? new Date(dto.iD) : null;
    if (dto.lD !== undefined) item.lD = dto.lD ? new Date(dto.lD) : null;
    if (dto.sD !== undefined) item.sD = dto.sD ? new Date(dto.sD) : null;

    await this.itemRepo.save(item);
    return this.findOneById(id);
  }

  // ✅ REVISI: Hanya hapus item & order (jika kosong). JANGAN hapus Product/Customer.
  async delete(id: number) {
    const item = await this.itemRepo.findOne({
      where: { itemId: id },
      relations: ['order'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    const orderId = item.order.orderId;

    // 1. Hapus item planning
    await this.itemRepo.remove(item);

    // 2. Hapus order hanya jika tidak ada item lain
    const remainingItemsInOrder = await this.itemRepo.count({
      where: { order: { orderId } },
    });
    let orderDeleted = false;
    if (remainingItemsInOrder === 0) {
      await this.orderRepo.delete(orderId);
      orderDeleted = true;
    }

    // ✅ JANGAN hapus Product atau Customer — biarkan sebagai master data permanen
    return {
      message: `Item with ID ${id} has been deleted`,
      details: {
        itemDeleted: true,
        orderDeleted,
        productDeleted: false, // ← selalu false
        customerDeleted: false, // ← selalu false
      },
    };
  }

  private parseSpec(spec: string): {
    specLength: number;
    specWidth: number;
    specHeight: number;
    specUnit: string;
  } {
    if (!spec?.trim()) {
      throw new BadRequestException('Field "spec" tidak boleh kosong');
    }

    const regex = /^(\d+\.?\d*)\s*\*\s*(\d+\.?\d*)\s*\*\s*(\d+\.?\d*)\s*([a-zA-Z]*)$/;
    const match = spec.trim().match(regex);

    if (!match) {
      throw new BadRequestException(
        `Format "spec" tidak valid: "${spec}". Gunakan format: "Panjang*Lebar*Tinggi[Satuan]", contoh: "75*54*8IN"`,
      );
    }

    return {
      specLength: parseFloat(match[1]),
      specWidth: parseFloat(match[2]),
      specHeight: parseFloat(match[3]),
      specUnit: match[4] || 'IN',
    };
  }

  async upload(dto: UploadProductionPlanningDto) {
    // 🔹 Cari atau buat Customer (find-or-create)
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

    // 🔹 Cari atau buat ProductionOrder (find-or-create)
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

    const results = [];
    const errors = [];

    for (const [index, itemDto] of dto.items.entries()) {
      try {
        this.parseSpec(itemDto.spec);

        // 🔹 Cari atau buat Product (find-or-create)
        let product = await this.productRepo.findOne({
          where: { sku: itemDto.sku },
        });

        if (!product) {
          product = this.productRepo.create({
            itemNumber: itemDto.itemNumber,
            sku: itemDto.sku,
            category: itemDto.category.trim().toUpperCase(),
            spec: itemDto.spec,
            itemDescription: itemDto.itemDescription,
          });
          await this.productRepo.save(product);
        }

        const plannedQty = this.parseInteger(itemDto.orderQty, 'orderQty');
        const sampleQty = this.parseInteger(itemDto.sample, 'sample');
        const weekNumber = this.parseInteger(itemDto.week, 'week');

        const item = this.itemRepo.create({
          order,
          product,
          iD: itemDto.iD ? new Date(itemDto.iD) : null,
          lD: itemDto.lD ? new Date(itemDto.lD) : null,
          sD: itemDto.sD ? new Date(itemDto.sD) : null,
          plannedQty,
          sampleQty,
          weekNumber,
        });

        const savedItem = await this.itemRepo.save(item);
        results.push(this.formatItemResponse(savedItem));
      } catch (error) {
        const errorMessage = error instanceof BadRequestException
          ? error.message
          : error.message || 'Gagal menyimpan item';
        errors.push({
          index: index + 1,
          item: itemDto.sku,
          error: errorMessage,
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
          spec: dto.spec,
          itemDescription: dto.itemDescription,
          iD: dto.iD,
          lD: dto.lD,
          sD: dto.sD,
          orderQty: dto.orderQty,
          sample: dto.sample || '0',
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
    return {
      id: item.itemId,
      'Ship to Name': item.order.customer.customerName,
      'Cust. PO': item.order.customerPo,
      'PO No.': item.order.poNumber,
      'Item Number': item.product.itemNumber,
      SKU: item.product.sku,
      Spec: item.product.spec,
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