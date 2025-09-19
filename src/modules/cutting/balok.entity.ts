// src/modules/cutting/balok.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CuttingRecord } from './cutting.entity';

@Entity('balok_data')
export class BalokEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  density: string | null;

  @Column({ type: 'text', nullable: true })
  ild: string | null;

  @Column({ type: 'text' })
  colour: string;

  @Column({ type: 'int', nullable: true })
  length: number | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'text', nullable: true })
  sizeActual: string | null;

  @Column({ type: 'int', nullable: true })
  qtyBalok: number | null;

  @ManyToOne(() => CuttingRecord, (cutting) => cutting.balok, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cuttingRecordId' })
  cuttingRecord: CuttingRecord;
}
