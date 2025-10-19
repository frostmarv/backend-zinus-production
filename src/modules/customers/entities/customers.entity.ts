// src/entities/customer.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('increment', { name: 'customer_id' })
  customerId: number;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'customer_code', unique: true })
  customerCode: string;
}
