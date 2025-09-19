// src/modules/cutting/actual.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CuttingRecord } from './cutting.entity';

@Entity('actual_data')
export class ActualEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  density!: string;

  @Column('text')
  ild!: string;

  @Column('text')
  colour!: string;

  @Column('int') // ❌ hapus nullable: true → karena WAJIB ISI
  length!: number;

  @Column('int')
  width!: number;

  @Column('int')
  height!: number;

  @Column('int')
  qtyBalok!: number;

  @Column('int')
  qtyProduksi!: number;

  @Column('text')
  reSize!: string;

  @Column('decimal', { precision: 5, scale: 2 })
  jdfWeight!: number;

  @Column({ nullable: true }) // opsional
  remark: string | null;

  @Column('text')
  descript!: 'FLAT' | 'HOLE';

  @ManyToOne(() => CuttingRecord, (record) => record.actuals)
  cuttingRecord!: CuttingRecord;
}
