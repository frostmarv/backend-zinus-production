// src/entities/production-planning-view.entity.ts
import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'v_production_planning' })
export class ProductionPlanningView {
  @ViewColumn({ name: 'Ship to Name' })
  ship_to_name: string;

  @ViewColumn({ name: 'Cust. PO' })
  cust_po: string;

  @ViewColumn({ name: 'PO No.' })
  po_no: string;

  @ViewColumn({ name: 'Item Number' })
  item_number: string;

  @ViewColumn({ name: 'SKU' })
  sku: string;

  @ViewColumn({ name: 'Spec' })
  spec: string;

  @ViewColumn({ name: 'Item Description' })
  item_description: string;

  @ViewColumn({ name: 'I/D' })
  i_d: string;

  @ViewColumn({ name: 'L/D' })
  l_d: string;

  @ViewColumn({ name: 'S/D' })
  s_d: string;

  @ViewColumn({ name: 'Order QTY' })
  order_qty: number;

  @ViewColumn({ name: 'Sample' })
  sample: number | null;

  @ViewColumn({ name: 'Total Qty' })
  total_qty: number;

  @ViewColumn({ name: 'Week' })
  week: number;

  @ViewColumn({ name: 'Category' })
  category: string;
}