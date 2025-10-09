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
  ASSEMBLY = 'ASSEMBLY',
}

@Entity('replacement_progress')
export class ReplacementProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_dept', type: 'enum', enum: DepartmentType })
  sourceDept: DepartmentType;

  @Column({ name: 'target_dept', type: 'enum', enum: DepartmentType })
  targetDept: DepartmentType;

  @Column({ name: 'source_batch_number' })
  sourceBatchNumber: string;

  @Column({ name: 'requested_qty', type: 'int' })
  requestedQty: number;

  @Column({ name: 'processed_qty', type: 'int', default: 0 })
  processedQty: number;

  @Column({
    type: 'enum',
    enum: ReplacementStatus,
    default: ReplacementStatus.PENDING,
  })
  status: ReplacementStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'bonding_reject_id', nullable: true })
  bondingRejectId: string;

  @ManyToOne(() => BondingReject, { nullable: true })
  @JoinColumn({ name: 'bonding_reject_id' })
  bondingReject: BondingReject;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
