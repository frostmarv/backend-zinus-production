import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Enum hanya untuk Cutting & Bonding
export enum NotificationRecipientDepartment {
  CUTTING = 'Cutting',
  BONDING = 'Bonding',
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    name: 'recipient_departments',
    type: 'simple-array', // Simpan sebagai string: "Cutting,Bonding"
  })
  recipientDepartments: NotificationRecipientDepartment[]; // Hanya Cutting & Bonding

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Column({ nullable: true })
  link: string;

  @Column({ name: 'read_status', default: false })
  readStatus: boolean;

  @Column({ name: 'related_entity_type', nullable: true })
  relatedEntityType: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
