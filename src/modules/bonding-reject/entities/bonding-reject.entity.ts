// src/entities/bonding-reject.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BondingRejectStatus {
  PENDING = 'PENDING',
  REPLACEMENT_REQUESTED = 'REPLACEMENT_REQUESTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ImageMetadata {
  filename: string;
  driveFileId: string;
  driveLink: string;
  size: number;
  uploadedAt: Date;
}

@Entity('bonding_reject')
export class BondingReject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'batch_number',
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: true,
  })
  batch_number: string | null;

  @Column({
    name: 'timestamp',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  timestamp: Date;

  @Column({ type: 'varchar', length: 10 })
  shift: string;

  @Column({ type: 'varchar', length: 10 })
  group: string;

  @Column({ name: 'time_slot', type: 'varchar', length: 50 })
  time_slot: string;

  @Column({ type: 'varchar', length: 100 })
  kashift: string;

  @Column({ type: 'varchar', length: 100 })
  admin: string;

  @Column({ type: 'varchar', length: 100 })
  customer: string;

  @Column({ name: 'po_number', type: 'varchar', length: 100 })
  po_number: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ name: 's_code', type: 'varchar', length: 50 })
  s_code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'ng_quantity', type: 'integer' })
  ng_quantity: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'json',
    nullable: true,
    default: null,
  })
  images?: ImageMetadata[] | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: BondingRejectStatus.PENDING,
  })
  status: BondingRejectStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}