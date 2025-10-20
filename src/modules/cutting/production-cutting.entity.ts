// src/modules/cutting/production-cutting.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductionCuttingEntry } from './production-cutting-entry.entity';

@Entity('production_cutting_records')
export class ProductionCuttingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  timestamp: string;

  @Column({ type: 'varchar', length: 10 })
  shift: string;

  @Column({ name: 'work_group', type: 'varchar', length: 10 })
  group: string;

  @Column({ type: 'varchar', length: 50 })
  time: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  machine: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operator: string;

  @OneToMany(
    () => ProductionCuttingEntry,
    (entry) => entry.productionCuttingRecord,
    {
      cascade: true,
    },
  )
  entries: ProductionCuttingEntry[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}