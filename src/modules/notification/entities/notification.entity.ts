// src/entities/notification.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    name: 'recipient_departments',
    type: 'text', // Gunakan text dan simpan sebagai JSON string
    transformer: {
      to: (value: NotificationRecipientDepartment[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  recipientDepartments: NotificationRecipientDepartment[];

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  link: string;

  @Column({ name: 'read_status', type: 'boolean', default: false })
  readStatus: boolean;

  @Column({ name: 'related_entity_type', type: 'varchar', length: 100, nullable: true })
  relatedEntityType: string;

  @Column({ name: 'related_entity_id', type: 'varchar', length: 100, nullable: true })
  relatedEntityId: string;

  @Column({ name: 'timestamp', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}