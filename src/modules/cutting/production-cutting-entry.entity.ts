// src/modules/cutting/production-cutting-entry.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionCuttingRecord } from './production-cutting.entity';

@Entity('production_cutting_entries')
export class ProductionCuttingEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  customer: string;

  @Column({ name: 'po_number', type: 'varchar', length: 100 })
  poNumber: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ name: 's_code', type: 'varchar', length: 50, nullable: true })
  sCode: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'quantity_order', type: 'numeric', precision: 10, scale: 2 })
  quantityOrder: number;

  @Column({ name: 'quantity_produksi', type: 'numeric', precision: 10, scale: 2 })
  quantityProduksi: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  week: string;

  @Column({ name: 'is_hole', type: 'boolean', default: false })
  isHole: boolean;

  @Column({ name: 'foaming_date', type: 'varchar', length: 20, nullable: true })
  foamingDate?: string;

  @Column({ name: 'foaming_date_completed', type: 'boolean', default: false })
  foamingDateCompleted: boolean;

  @Column({ name: 'quantity_hole', type: 'integer', default: 0 })
  quantityHole: number;

  @Column({ name: 'quantity_hole_remain', type: 'integer', default: 0 })
  quantityHoleRemain: number;

  @ManyToOne(() => ProductionCuttingRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_cutting_record_id' })
  productionCuttingRecord: ProductionCuttingRecord;
}