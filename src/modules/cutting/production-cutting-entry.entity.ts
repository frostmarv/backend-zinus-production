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

  @Column()
  customer: string;

  @Column()
  poNumber: string;

  @Column()
  sku: string;

  @Column({ nullable: true })
  sCode: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantityOrder: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantityProduksi: number;

  @Column({ nullable: true })
  week: string;

  // ✅ Tambahkan kolom isHole dan foamingDate
  @Column({ name: 'is_hole', type: 'boolean', default: false })
  isHole: boolean;

  @Column({ name: 'foaming_date', nullable: true })
  foamingDate?: string; // ISO string format

  // ✅ Tambahkan kolom baru untuk logika tambahan
  @Column({ name: 'foaming_date_completed', type: 'boolean', default: false })
  foamingDateCompleted: boolean;

  @Column({ name: 'quantity_hole', type: 'int', default: 0 })
  quantityHole: number;

  @Column({ name: 'quantity_hole_remain', type: 'int', default: 0 })
  quantityHoleRemain: number;

  @ManyToOne(() => ProductionCuttingRecord, (record) => record.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'production_cutting_record_id' })
  productionCuttingRecord: ProductionCuttingRecord;
}
