// src/entities/production-order-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionOrder } from './production-order.entity';
import { Product } from './product.entity';

@Entity('production_order_items')
export class ProductionOrderItem {
  @PrimaryGeneratedColumn({ name: 'item_id' })
  itemId: number;

  @Column({ name: 'order_order_id' })
  orderOrderId: number;

  @ManyToOne(() => ProductionOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_order_id', referencedColumnName: 'orderId' })
  order: ProductionOrder;

  @Column({ name: 'product_product_id' })
  productProductId: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_product_id', referencedColumnName: 'productId' })
  product: Product;

  @Column({ name: 'planned_qty', type: 'integer' })
  plannedQty: number;

  @Column({ name: 'sample_qty', type: 'integer', default: 0 })
  sampleQty: number;

  @Column({ name: 'week_number', type: 'integer' })
  weekNumber: number;

  @Column({ name: 'i_d', type: 'date', nullable: true })
  iD: Date | null;

  @Column({ name: 'l_d', type: 'date', nullable: true })
  lD: Date | null;

  @Column({ name: 's_d', type: 'date', nullable: true })
  sD: Date | null;

  get totalPlanned(): number {
    return this.plannedQty + this.sampleQty;
  }
}