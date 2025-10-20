// src/modules/master-data/entities/production-order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../../entities/customer.entity';

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn({ name: 'order_id' })
  order_id: number;

  @Column({ name: 'customer_id', type: 'integer' })
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'customerId' })
  customer: Customer;

  @Column({ name: 'customer_po', type: 'varchar', length: 100 })
  customer_po: string;

  @Column({ name: 'po_number', type: 'varchar', length: 100 })
  po_number: string;

  @Column({ name: 'order_date', type: 'date', nullable: true })
  order_date: Date;
}