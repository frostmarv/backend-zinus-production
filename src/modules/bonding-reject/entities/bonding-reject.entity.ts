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

export enum ShiftType {
  A = 'A',
  B = 'B',
}

export enum GroupType {
  A = 'A',
  B = 'B',
}

@Entity('bonding_reject')
export class BondingReject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'batch_number', unique: true })
  batchNumber: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  // ✅ Ganti dari 'enum' → 'varchar'
  @Column({ type: 'varchar' })
  shift: ShiftType;

  @Column({ type: 'varchar' })
  group: GroupType;

  @Column({ name: 'time_slot' })
  timeSlot: string;

  @Column({ nullable: true })
  machine: string;

  @Column()
  kashift: string;

  @Column()
  admin: string;

  @Column()
  customer: string;

  @Column({ name: 'po_number' })
  poNumber: string;

  @Column({ name: 'customer_po' })
  customerPo: string;

  @Column()
  sku: string;

  @Column({ name: 's_code' })
  sCode: string;

  @Column({ name: 'ng_quantity', type: 'int' })
  ngQuantity: number;

  @Column({ type: 'text' })
  reason: string;

  // ✅ Ganti dari 'enum' → 'varchar'
  @Column({
    type: 'varchar',
    default: BondingRejectStatus.PENDING,
  })
  status: BondingRejectStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
