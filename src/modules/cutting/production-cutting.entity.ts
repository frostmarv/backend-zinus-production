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

  @Column()
  timestamp: string;

  @Column()
  shift: string;

  @Column({ name: 'work_group' })
  group: string;

  @Column()
  time: string;

  @Column({ nullable: true })
  machine: string;

  @Column({ nullable: true })
  operator: string;

  // ✅ Import entity entry yang baru
  @OneToMany(
    () => ProductionCuttingEntry,
    (entry) => entry.productionCuttingRecord,
    {
      cascade: true,
    },
  )
  entries: ProductionCuttingEntry[];

  @CreateDateColumn()
  createdAt: Date;
}
