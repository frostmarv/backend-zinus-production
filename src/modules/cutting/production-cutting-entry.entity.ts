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
  customerPO: string;

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

  @ManyToOne(() => ProductionCuttingRecord, (record) => record.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'production_cutting_record_id' })
  productionCuttingRecord: ProductionCuttingRecord;
}
