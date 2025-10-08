import { Injectable } from '@nestjs/common';
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

  // 1. Customers
  async getCustomers() {
    const customers = await this.customerRepo.find({
      where: { is_active: true },
    });
    return customers.map((c) => ({
      value: c.customer_id,
      label: c.customer_name,
    }));
  }

  // 2. PO Numbers by Customer
  async getPoNumbers(customerId: number) {
    const orders = await this.orderRepo.find({
      where: { customer: { customer_id: customerId } },
      select: ['po_number'],
    });
    const unique = [...new Set(orders.map((o) => o.po_number))];
    return unique.map((po) => ({ value: po, label: po }));
  }

  // 3. Customer POs by PO Number
  async getCustomerPos(poNumber: string) {
    const orders = await this.orderRepo.find({
      where: { po_number: poNumber },
      select: ['customer_po'],
    });
    const unique = [...new Set(orders.map((o) => o.customer_po))];
    return unique.map((cpo) => ({ value: cpo, label: cpo }));
  }

  // 4. SKUs by Customer PO (dengan F.CODE)
  async getSkus(customerPo: string) {
    const items = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .where('po.customer_po = :customerPo', { customerPo })
      .select(['p.sku', 'p.item_number'])
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

  // 5. Qty Plans by Customer PO + SKU (dengan F.CODE, S.CODE, Description)
  async getQtyPlans(customerPo: string, sku: string) {
    const items = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .leftJoin('assembly_layers', 'al', 'al.productProductId = p.product_id')
      .where('po.customer_po = :customerPo', { customerPo })
      .andWhere('p.sku = :sku', { sku })
      .select([
        'poi.planned_qty as planned_qty',
        'p.item_number as item_number',
        'al.second_item_number as second_item_number',
        'al.description as description',
      ])
      .getRawMany();

    // Group by qty with F.CODE and optional S.CODE/Description
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

  // 6. Weeks by Customer PO + SKU (dengan F.CODE, S.CODE, Description)
  async getWeeks(customerPo: string, sku: string) {
    const items = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .leftJoin('assembly_layers', 'al', 'al.productProductId = p.product_id')
      .where('po.customer_po = :customerPo', { customerPo })
      .andWhere('p.sku = :sku', { sku })
      .select([
        'poi.week_number as week_number',
        'p.item_number as item_number',
        'al.second_item_number as second_item_number',
        'al.description as description',
      ])
      .getRawMany();

    // Group by week with F.CODE and optional S.CODE/Description
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

  // 7. Assembly Layers by SKU
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

  // 8. Remain Quantity (quantityOrder - total produksi untuk layer tertentu)
  async getRemainQuantity(
    customerPo: string,
    sku: string,
    sCode: string,
  ): Promise<{
    quantityOrder: number;
    totalProduced: number;
    remainQuantity: number;
  }> {
    // 1. Get quantityOrder dari production_order_items (aggregate jika ada multiple items)
    const orderItem = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .where('po.customer_po = :customerPo', { customerPo })
      .andWhere('p.sku = :sku', { sku })
      .select('COALESCE(SUM(poi.planned_qty), 0)', 'quantityOrder')
      .getRawOne();

    const quantityOrder = Number(orderItem?.quantityOrder || 0);

    // 2. Hitung total produksi actual untuk layer ini (customerPO + sku + sCode)
    const productionTotal = await this.cuttingEntryRepo
      .createQueryBuilder('pce')
      .where('pce.customerPO = :customerPo', { customerPo })
      .andWhere('pce.sku = :sku', { sku })
      .andWhere('pce.sCode = :sCode', { sCode })
      .select('SUM(pce.quantityProduksi)', 'total')
      .getRawOne();

    const totalProduced = Number(productionTotal?.total || 0);

    // 3. Hitung remain
    const remainQuantity = quantityOrder - totalProduced;

    return {
      quantityOrder,
      totalProduced,
      remainQuantity,
    };
  }

  // 9. Generic Remain Quantity by Department (scalable untuk semua department)
  // Department: bonding, assembly, packing, dll (kecuali cutting yang punya case khusus)
  async getRemainQuantityByDepartment(
    customerPo: string,
    sku: string,
    department: 'bonding' | 'assembly' | 'packing' | string,
  ): Promise<{
    quantityOrder: number;
    totalProduced: number;
    remainQuantity: number;
  }> {
    // 1. Get quantityOrder dari production_order_items
    const orderItem = await this.itemRepo
      .createQueryBuilder('poi')
      .innerJoin('poi.order', 'po')
      .innerJoin('poi.product', 'p')
      .where('po.customer_po = :customerPo', { customerPo })
      .andWhere('p.sku = :sku', { sku })
      .select('COALESCE(SUM(poi.planned_qty), 0)', 'quantityOrder')
      .getRawOne();

    const quantityOrder = Number(orderItem?.quantityOrder || 0);

    // 2. Hitung total produksi berdasarkan department
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

      // TODO: Tambahkan case untuk department lain
      // case 'assembly':
      //   const assemblyTotal = await this.assemblySummaryRepo...
      //   totalProduced = Number(assemblyTotal?.total || 0);
      //   break;
      
      // case 'packing':
      //   const packingTotal = await this.packingSummaryRepo...
      //   totalProduced = Number(packingTotal?.total || 0);
      //   break;

      default:
        throw new Error(`Department '${department}' is not supported yet`);
    }

    // 3. Hitung remain
    const remainQuantity = quantityOrder - totalProduced;

    return {
      quantityOrder,
      totalProduced,
      remainQuantity,
    };
  }

  // 10. Wrapper untuk Bonding (backward compatibility)
  async getRemainQuantityBonding(
    customerPo: string,
    sku: string,
  ): Promise<{
    quantityOrder: number;
    totalProduced: number;
    remainQuantity: number;
  }> {
    return this.getRemainQuantityByDepartment(customerPo, sku, 'bonding');
  }
}
