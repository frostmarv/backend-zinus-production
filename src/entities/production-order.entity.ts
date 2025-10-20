// src/entities/production-order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'customer_customer_id' })
  customerCustomerId: number;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'customer_customer_id',
    referencedColumnName: 'customerId',
  })
  customer: Customer;

  @Column({ name: 'customer_po', type: 'varchar', length: 100 })
  customerPo: string;

  @Column({ name: 'po_number', type: 'varchar', length: 100 })
  poNumber: string;

  @Column({ name: 'order_date', type: 'date' })
  orderDate: Date;
}