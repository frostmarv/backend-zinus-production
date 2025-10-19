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
  @PrimaryGeneratedColumn('increment', { name: 'item_id' })
  itemId: number;

  @Column({ name: 'orderOrderId' })
  orderOrderId: number;

  @ManyToOne(() => ProductionOrder, (order) => order.orderId, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderOrderId', referencedColumnName: 'orderId' })
  order: ProductionOrder;

  @Column({ name: 'productProductId' })
  productProductId: number;

  @ManyToOne(() => Product, (product) => product.productId, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'productProductId', referencedColumnName: 'productId' })
  product: Product;

  @Column({ name: 'planned_qty' })
  plannedQty: number;

  @Column({ name: 'sample_qty', default: 0 })
  sampleQty: number;

  @Column({ name: 'week_number' })
  weekNumber: number;

  @Column({ name: 'i_d', type: 'date', nullable: true })
  iD: Date | null;

  @Column({ name: 'l_d', type: 'date', nullable: true })
  lD: Date | null;

  @Column({ name: 's_d', type: 'date', nullable: true })
  sD: Date | null;

  // Virtual column: total_qty = planned_qty + sample_qty
  get totalPlanned(): number {
    return this.plannedQty + this.sampleQty;
  }
}
