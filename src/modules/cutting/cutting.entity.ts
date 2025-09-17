// src/modules/cutting/cutting.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { BalokEntity } from './balok.entity'; // ← impor entity anak

@Entity('cutting_records')
export class CuttingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  timestamp: string;

  @Column()
  shift: string;

  @Column()
  group: string;

  @Column()
  machine: string;

  @Column()
  timeSlot: string;

  @Column({ nullable: true })
  week: string;

  @OneToMany(() => BalokEntity, balok => balok.cuttingRecord, { cascade: true })
  balok: BalokEntity[];

  @Column({ type: 'jsonb', nullable: true })
  foamingDate: {
    isChecked: boolean;
    tanggalSelesai?: string;
    jam?: string;
  } | null; // ← boleh null

  @CreateDateColumn()
  createdAt: Date;
}