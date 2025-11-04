// src/packing-foam/entities/packing-foam-summary.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('packing_foam_summaries')
export class PackingFoamSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', name: 'timestamp' })
  timestamp: Date;

  @Column()
  shift: string;

  @Column()
  group: string;

  @Column({ name: 'time_slot' })
  timeSlot: string;

  @Column()
  machine: string;

  @Column()
  kashift: string;

  @Column()
  admin: string;

  @Column()
  customer: string;

  @Column({ name: 'po_number' })
  poNumber: string;

  @Column({ name: 'customer_po' })
  customerPo: string;

  @Column()
  sku: string;

  @Column()
  week: string;

  @Column({ name: 'quantity_produksi' })
  quantityProduksi: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}