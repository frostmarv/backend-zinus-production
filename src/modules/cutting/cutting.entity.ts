// src/modules/cutting/cutting.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { BalokEntity } from './balok.entity';
import { ActualEntity } from './actual.entity';

@Entity('cutting_records')
export class CuttingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productionDate: string; // ganti dari timestamp

  @Column()
  shift: string;

  @Column()
  machine: string;

  @Column()
  operator: string;

  @Column()
  time: string;

  @Column('int')
  noUrut: number;

  @Column({ nullable: true })
  week: string;

  @OneToMany(() => BalokEntity, (balok) => balok.cuttingRecord, {
    cascade: true,
  })
  balok: BalokEntity[];

  @OneToMany(() => ActualEntity, (actual) => actual.cuttingRecord, {
    cascade: true,
  })
  actuals: ActualEntity[];

  @Column('json', { nullable: true })
  foamingDate: {
    isChecked: boolean;
    tanggalSelesai: string;
    jam: string;
  } | null;

  @CreateDateColumn()
  createdAt: Date;
}
