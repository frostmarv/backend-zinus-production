import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationRecipientRole {
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
  OPERATOR = 'OPERATOR',
  SUPERVISOR = 'SUPERVISOR',
  ALL = 'ALL',
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
    name: 'recipient_roles',
    type: 'simple-array',
  })
  recipientRoles: NotificationRecipientRole[];

  // ✅ Ganti 'enum' → 'varchar'
  @Column({
    type: 'varchar',
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

  // ✅ Ganti 'timestamp' → 'datetime'
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
