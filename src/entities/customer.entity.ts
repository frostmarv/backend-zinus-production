// src/entities/customer.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn({ name: 'customer_id' })
  customerId: number;

  @Column({ name: 'customer_name', type: 'varchar', length: 255 })
  customerName: string;

  @Column({ name: 'customer_code', type: 'varchar', length: 100, unique: true })
  customerCode: string;
}