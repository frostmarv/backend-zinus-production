import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn()
  order_id: number;

  @ManyToOne(() => Customer, customer => customer.customer_id)
  customer: Customer;

  @Column()
  customer_po: string;

  @Column({ unique: true })
  po_number: string;

  @Column({ nullable: true })
  order_date: Date;

  @Column({ default: 'confirmed' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}