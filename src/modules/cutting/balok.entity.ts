// src/modules/cutting/balok.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CuttingRecord } from './cutting.entity';

@Entity('balok_data')
export class BalokEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true }) // ✅ tambahkan 'text'
  density: string | null;

  @Column('text', { nullable: true })
  ild: string | null;

  @Column('text') // ✅ pastikan tipe jelas
  colour: string;

  @Column('int', { nullable: true })
  length: number | null;

  @Column('int', { nullable: true })
  width: number | null;

  @Column('int', { nullable: true })
  height: number | null;

  @Column('text', { nullable: true })
  sizeActual: string | null;

  @Column('int', { nullable: true })
  qtyBalok: number | null;

  @ManyToOne(() => CuttingRecord, (cutting) => cutting.balok)
  cuttingRecord: CuttingRecord;
}
