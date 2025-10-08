import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ProductionOrder } from './production-order.entity';
import { Product } from './product.entity';

@Entity('production_order_items')
export class ProductionOrderItem {
  @PrimaryGeneratedColumn()
  item_id: number;

  @ManyToOne(() => ProductionOrder, (order) => order.order_id)
  order: ProductionOrder;

  @ManyToOne(() => Product, (product) => product.product_id)
  product: Product;

  @Column()
  planned_qty: number;

  @Column({ default: 0 })
  sample_qty: number;

  @Column({
    type: 'int',
    asExpression: 'planned_qty + sample_qty',
    generatedType: 'STORED',
  })
  total_planned: number;

  @Column({ nullable: true })
  week_number: number;

  @Column({ nullable: true })
  i_d: Date;

  @Column({ nullable: true })
  l_d: Date;

  @Column({ nullable: true })
  s_d: Date;

  @CreateDateColumn()
  created_at: Date;
}
