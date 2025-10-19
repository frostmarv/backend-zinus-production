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
  @PrimaryGeneratedColumn('increment', { name: 'order_id' })
  orderId: number;

  @Column({ name: 'customerCustomerId' })
  customerCustomerId: number;

  @ManyToOne(() => Customer, (customer) => customer.customerId, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'customerCustomerId',
    referencedColumnName: 'customerId',
  })
  customer: Customer;

  @Column({ name: 'customer_po' })
  customerPo: string;

  @Column({ name: 'po_number' })
  poNumber: string;

  @Column({ name: 'order_date', type: 'date' })
  orderDate: Date;
}
