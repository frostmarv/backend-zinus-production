// src/modules/replacement/entities/replacement-progress.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BondingReject } from '../../bonding-reject/entities/bonding-reject.entity';

export enum ReplacementStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DepartmentType {
  BONDING = 'BONDING',
  CUTTING = 'CUTTING',
}

@Entity('replacement_progress')
export class ReplacementProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_dept', type: 'varchar', length: 20 })
  sourceDept: DepartmentType;

  @Column({ name: 'target_dept', type: 'varchar', length: 20 })
  targetDept: DepartmentType;

  @Column({ name: 'source_batch_number', type: 'varchar', length: 100 })
  sourceBatchNumber: string;

  @Column({ name: 'requested_qty', type: 'integer' })
  requestedQty: number;

  @Column({ name: 'processed_qty', type: 'integer', default: 0 })
  processedQty: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: ReplacementStatus.PENDING,
  })
  status: ReplacementStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'bonding_reject_id', type: 'varchar', nullable: true })
  bondingRejectId: string;

  @ManyToOne(() => BondingReject, { nullable: true })
  @JoinColumn({ name: 'bonding_reject_id' })
  bondingReject: BondingReject;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}