import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReplacementProgress } from '../../replacement/entities/replacement-progress.entity';

export enum CuttingProcessStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('cutting_process')
export class CuttingProcess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'replacement_id' })
  replacementId: string;

  @ManyToOne(() => ReplacementProgress)
  @JoinColumn({ name: 'replacement_id' })
  replacement: ReplacementProgress;

  @Column({ name: 'processed_qty', type: 'int', default: 0 })
  processedQty: number;

  @Column({
    type: 'enum',
    enum: CuttingProcessStatus,
    default: CuttingProcessStatus.PENDING,
  })
  status: CuttingProcessStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'operator_name', nullable: true })
  operatorName: string;

  @Column({ name: 'machine_id', nullable: true })
  machineId: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
