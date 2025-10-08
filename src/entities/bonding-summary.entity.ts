import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('bonding_summary')
@Index(['customer'])
@Index(['poNumber'])
@Index(['sku'])
@Index(['createdAt'])
export class BondingSummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  timestamp: string;

  @Column({ type: 'varchar', length: 10 })
  shift: string;

  @Column({ type: 'varchar', length: 10 })
  group: string;

  @Column({ name: 'time_slot', type: 'varchar', length: 50 })
  timeSlot: string;

  @Column({ type: 'varchar', length: 50 })
  machine: string;

  @Column({ type: 'varchar', length: 100 })
  kashift: string;

  @Column({ type: 'varchar', length: 100 })
  admin: string;

  @Column({ type: 'varchar', length: 100 })
  customer: string;

  @Column({ name: 'po_number', type: 'varchar', length: 100 })
  poNumber: string;

  @Column({ name: 'customer_po', type: 'varchar', length: 100 })
  customerPo: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 10 })
  week: string;

  @Column({ name: 'quantity_produksi', type: 'int' })
  quantityProduksi: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
