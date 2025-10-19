// src/modules/master-data/master-data.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { ProductionOrder } from '../../entities/production-order.entity';
import { ProductionOrderItem } from '../../entities/production-order-item.entity';
import { Product } from '../../entities/product.entity';
import { AssemblyLayer } from '../../entities/assembly-layer.entity';
import { ProductionCuttingEntry } from '../cutting/production-cutting-entry.entity';
import { BondingSummary } from '../../entities/bonding-summary.entity';

@Injectable()
export class MasterDataService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(ProductionOrder)
    private orderRepo: Repository<ProductionOrder>,
    @InjectRepository(ProductionOrderItem)
    private itemRepo: Repository<ProductionOrderItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(AssemblyLayer)
    private assemblyLayerRepo: Repository<AssemblyLayer>,
    @InjectRepository(ProductionCuttingEntry)
    private cuttingEntryRepo: Repository<ProductionCuttingEntry>,
    @InjectRepository(BondingSummary)
    private bondingSummaryRepo: Repository<BondingSummary>,
  ) {}

  async getCustomers() {
    const customers = await this.customerRepo.find({
      // 🔴 Perbaikan: ganti is_active ke property name
      // where: { is_active: true },
      where: {}, // 🔵 Jika tidak ada field is_active, hapus filter
    });
    return customers.map((c) => ({
      // 🔴 Perbaikan: gunakan property name
      value: c.customerId,
      label: c.customerName,
    }));
  }

  async getPoNumbers(customerId: number) {
    const orders = await this.orderRepo.find({
      // 🔴 Perbaikan: gunakan property name
      where: { customer: { customerId } },
      select: ['poNumber'], // 🔴 Perbaikan: gunakan property name
    });
    const unique = [...new Set(orders.map((o) => o.poNumber))];
    return unique.map((po) => ({ value: po, label: po }));
  }

  async getCustomerPos(poNumber: string) {
    const orders = await this.orderRepo.find({
      // 🔴 Perbaikan: gunakan property name
      where: { poNumber },
      select: ['customerPo'], // 🔴 Perbaikan: gunakan property name
    });
    const unique = [...new Set(orders.map((o) => o.customerPo))];
    return unique.map((cpo) => ({ value: cpo, label: cpo }));
  }

  async getSkus(customerPo: string) {
    const items = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .where('po.customerPo = :customerPo', { customerPo })
      .select(['p.sku', 'p.itemNumber'])
      .getRawMany();

    const uniqueMap = new Map();
    items.forEach((i) => {
      if (!uniqueMap.has(i.p_sku)) {
        uniqueMap.set(i.p_sku, i.p_item_number);
      }
    });

    return Array.from(uniqueMap.entries()).map(([sku, itemNumber]) => ({
      value: sku,
      label: sku,
      f_code: itemNumber,
    }));
  }

  async getQtyPlans(customerPo: string, sku: string) {
    const items = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .leftJoin('assembly_layers', 'al', 'al.productProductId = p.product_id')
      .where('po.customerPo = :customerPo', { customerPo })
      .andWhere('p.sku = :sku', { sku })
      .select([
        'poi.planned_qty as planned_qty',
        'p.item_number as item_number',
        'al.second_item_number as second_item_number',
        'al.description as description',
      ])
      .getRawMany();

    const qtyMap = new Map();
    items.forEach((i) => {
      const key = i.planned_qty;
      if (!qtyMap.has(key)) {
        qtyMap.set(key, {
          f_code: i.item_number,
          s_codes: [],
        });
      }
      if (i.second_item_number) {
        qtyMap.get(key).s_codes.push({
          s_code: i.second_item_number,
          description: i.description,
        });
      }
    });

    return Array.from(qtyMap.entries()).map(([qty, data]) => ({
      value: qty,
      label: qty.toString(),
      f_code: data.f_code,
      s_codes: data.s_codes,
    }));
  }

  async getWeeks(customerPo: string, sku: string) {
    const items = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .leftJoin('assembly_layers', 'al', 'al.productProductId = p.product_id')
      .where('po.customerPo = :customerPo', { customerPo })
      .andWhere('p.sku = :sku', { sku })
      .select([
        'poi.week_number as week_number',
        'p.item_number as item_number',
        'al.second_item_number as second_item_number',
        'al.description as description',
      ])
      .getRawMany();

    const weekMap = new Map();
    items.forEach((i) => {
      const key = i.week_number;
      if (!weekMap.has(key)) {
        weekMap.set(key, {
          f_code: i.item_number,
          s_codes: [],
        });
      }
      if (i.second_item_number) {
        weekMap.get(key).s_codes.push({
          s_code: i.second_item_number,
          description: i.description,
        });
      }
    });

    return Array.from(weekMap.entries()).map(([week, data]) => ({
      value: week,
      label: `Week ${week}`,
      f_code: data.f_code,
      s_codes: data.s_codes,
    }));
  }

  async getAssemblyLayers(sku: string) {
    const layers = await this.assemblyLayerRepo
      .createQueryBuilder('al')
      .innerJoin('al.product', 'p')
      .where('p.sku = :sku', { sku })
      .orderBy('al.layerIndex', 'ASC')
      .addOrderBy('al.id', 'ASC')
      .select([
        'al.secondItemNumber',
        'al.description',
        'al.descriptionLine2',
        'al.layerIndex',
      ])
      .getMany();

    return layers.map((layer) => ({
      value: layer.secondItemNumber,
      label: layer.description,
      description_line_2: layer.descriptionLine2,
      layer_index: layer.layerIndex,
    }));
  }

  async getRemainQuantityForCutting(
    customerPo: string,
    sku: string,
    sCode: string,
  ) {
    const order = await this.orderRepo.findOne({
      where: { customerPo },
      select: ['poNumber'],
    });

    if (!order) {
      throw new BadRequestException(
        `Tidak ditemukan PO untuk customerPO: ${customerPo}`,
      );
    }

    const poNumber = order.poNumber;

    const orderItem = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .where('po.customerPo = :customerPo', { customerPo })
      .andWhere('p.sku = :sku', { sku })
      .select('COALESCE(SUM(poi.planned_qty), 0)', 'quantityOrder')
      .getRawOne();

    const quantityOrder = Number(orderItem?.quantityOrder || 0);

    const productionTotal = await this.cuttingEntryRepo
      .createQueryBuilder('pce')
      .where('pce.poNumber = :poNumber', { poNumber })
      .andWhere('pce.sku = :sku', { sku })
      .andWhere('pce.sCode = :sCode', { sCode })
      .select('COALESCE(SUM(pce.quantityProduksi), 0)', 'total')
      .getRawOne();

    const totalProduced = Number(productionTotal?.total || 0);
    const remainQuantity = Math.max(0, quantityOrder - totalProduced);

    return {
      quantityOrder,
      totalProduced,
      remainQuantity,
    };
  }

  async getRemainQuantityByDepartment(
    customerPo: string,
    sku: string,
    department: string,
  ) {
    const orderItem = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .where('po.customerPo = :customerPo', { customerPo })
      .andWhere('p.sku = :sku', { sku })
      .select('COALESCE(SUM(poi.planned_qty), 0)', 'quantityOrder')
      .getRawOne();

    const quantityOrder = Number(orderItem?.quantityOrder || 0);
    let totalProduced = 0;

    switch (department.toLowerCase()) {
      case 'bonding':
        const bondingTotal = await this.bondingSummaryRepo
          .createQueryBuilder('bs')
          .where('bs.customer_po = :customerPo', { customerPo })
          .andWhere('bs.sku = :sku', { sku })
          .select('COALESCE(SUM(bs.quantity_produksi), 0)', 'total')
          .getRawOne();
        totalProduced = Number(bondingTotal?.total || 0);
        break;

      default:
        throw new BadRequestException(
          `Department '${department}' is not supported`,
        );
    }

    const remainQuantity = Math.max(0, quantityOrder - totalProduced);
    return { quantityOrder, totalProduced, remainQuantity };
  }

  async getRemainQuantityBonding(customerPo: string, sku: string) {
    return this.getRemainQuantityByDepartment(customerPo, sku, 'bonding');
  }
}
