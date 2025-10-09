// src/modules/bonding-reject/entities/bonding-reject.entity.ts
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

@Entity('bonding_reject')
export class BondingReject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ❌ HAPUS batchNumber karena tidak dikirim dari form
  // Jika tetap butuh, generate otomatis di backend (misal: BR-{timestamp}-{id})

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'varchar' })
  shift: string; // ✅ Sesuai form (kirim string '1' atau '2')

  @Column({ type: 'varchar' })
  group: string; // ✅ Sesuai form ('A' atau 'B')

  @Column({ name: 'time_slot' })
  timeSlot: string;

  // ❌ HAPUS machine karena sudah dihapus di form
  // @Column({ nullable: true })
  // machine: string;

  @Column()
  kashift: string;

  @Column()
  admin: string;

  @Column()
  customer: string;

  @Column({ name: 'po_number' })
  poNumber: string;

  // ❌ HAPUS customerPo karena sudah dihapus di form
  // @Column({ name: 'customer_po' })
  // customerPo: string;

  @Column()
  sku: string;

  @Column({ name: 's_code' })
  sCode: string;

  @Column({ name: 'ng_quantity', type: 'int' })
  ngQuantity: number;

  @Column({ type: 'text' })
  reason: string;

  // ✅ Tambahkan field untuk menyimpan gambar (opsional)
  @Column({ type: 'simple-array', nullable: true })
  images?: string[]; // Simpan array path file atau base64 (tergantung implementasi)

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
