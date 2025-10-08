// src/modules/cutting/actual.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CuttingRecord } from './cutting.entity';

@Entity('actual_data')
export class ActualEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  density: string | null;

  @Column({ type: 'text', nullable: true })
  ild: string | null;

  @Column('text')
  colour: string;

  @Column({ type: 'int', nullable: true })
  length: number | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'int', nullable: true })
  qtyBalok: number | null;

  @Column({ type: 'int', nullable: true })
  qtyProduksi: number | null;

  @Column({ type: 'text', nullable: true })
  reSize: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  jdfWeight: number | null;

  @Column({ nullable: true }) // opsional
  remark: string | null;

  @Column('text')
  descript: 'FLAT' | 'HOLE';

  @ManyToOne(() => CuttingRecord, (record) => record.actuals, {
    onDelete: 'CASCADE', // ✅ TAMBAHKAN INI
  })
  @JoinColumn({ name: 'cuttingRecordId' }) // ✅ TAMBAHKAN INI
  cuttingRecord: CuttingRecord;
}
