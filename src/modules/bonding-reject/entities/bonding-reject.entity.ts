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
    unique: true,
    nullable: true,
  })
  batch_number: string | null;

  @Column({
    name: 'timestamp',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  timestamp: Date;

  @Column({ type: 'varchar' })
  shift: string;

  @Column({ type: 'varchar' })
  group: string;

  @Column({ name: 'time_slot', type: 'varchar' })
  time_slot: string;

  @Column({ type: 'varchar' })
  kashift: string;

  @Column({ type: 'varchar' })
  admin: string;

  @Column({ type: 'varchar' })
  customer: string;

  @Column({ name: 'po_number', type: 'varchar' })
  po_number: string;

  @Column({ type: 'varchar' })
  sku: string;

  @Column({ name: 's_code', type: 'varchar' })
  s_code: string;

  // ✅ TAMBAHKAN KOLON DESCRIPTION DI SINI
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'ng_quantity', type: 'int' })
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

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
