// src/modules/auth/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { Department } from '../../../common/enums/department.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nama: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'nomor_hp', length: 20 })
  nomorHp: string;

  // ✅ Diperbaiki: SQLite tidak mendukung tipe 'enum'
  @Column()
  department: Department;

  @Column()
  role: Role;

  @Column()
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
