import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationRecipientRole, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async send(createDto: CreateNotificationDto): Promise<Notification> {
    this.logger.log(`Sending notification: ${createDto.title} to roles: ${createDto.recipientRoles.join(', ')}`);

    const notification = this.notificationRepository.create({
      ...createDto,
      type: createDto.type || NotificationType.INFO,
      readStatus: false,
      timestamp: new Date(),
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`Notification sent with ID: ${saved.id}`);

    return saved;
  }

  async sendBondingRejectNotification(
    batchNumber: string,
    ngQuantity: number,
    bondingRejectId: string,
  ): Promise<Notification> {
    return this.send({
      title: 'New Bonding NG Reject',
      message: `Bonding NG detected: Batch ${batchNumber}, Quantity: ${ngQuantity}. Replacement request has been created.`,
      recipientRoles: [NotificationRecipientRole.ADMIN, NotificationRecipientRole.LEADER],
      type: NotificationType.WARNING,
      link: `/bonding/reject/${bondingRejectId}`,
      relatedEntityType: 'BondingReject',
      relatedEntityId: bondingRejectId,
    });
  }

  async sendReplacementCreatedNotification(
    replacementId: string,
    sourceBatchNumber: string,
    requestedQty: number,
  ): Promise<Notification> {
    return this.send({
      title: 'Replacement Request Created',
      message: `New replacement request for batch ${sourceBatchNumber}, Quantity: ${requestedQty}`,
      recipientRoles: [NotificationRecipientRole.ADMIN, NotificationRecipientRole.SUPERVISOR],
      type: NotificationType.INFO,
      link: `/replacement/${replacementId}`,
      relatedEntityType: 'ReplacementProgress',
      relatedEntityId: replacementId,
    });
  }

  async sendReplacementCompletedNotification(
    replacementId: string,
    sourceBatchNumber: string,
    processedQty: number,
  ): Promise<Notification> {
    return this.send({
      title: 'Replacement Completed',
      message: `Replacement for batch ${sourceBatchNumber} completed. Processed: ${processedQty}`,
      recipientRoles: [NotificationRecipientRole.ADMIN, NotificationRecipientRole.LEADER],
      type: NotificationType.SUCCESS,
      link: `/replacement/${replacementId}`,
      relatedEntityType: 'ReplacementProgress',
      relatedEntityId: replacementId,
    });
  }

  async sendCuttingProcessNotification(
    cuttingProcessId: string,
    replacementId: string,
    processedQty: number,
  ): Promise<Notification> {
    return this.send({
      title: 'Cutting Process Update',
      message: `Cutting process updated. Processed quantity: ${processedQty}`,
      recipientRoles: [NotificationRecipientRole.ADMIN, NotificationRecipientRole.SUPERVISOR],
      type: NotificationType.INFO,
      link: `/cutting/replacement/${cuttingProcessId}`,
      relatedEntityType: 'CuttingProcess',
      relatedEntityId: cuttingProcessId,
    });
  }

  async findAll(filters?: {
    recipientRole?: NotificationRecipientRole;
    readStatus?: boolean;
    type?: NotificationType;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<Notification[]> {
    const query = this.notificationRepository.createQueryBuilder('n');

    if (filters?.recipientRole) {
      query.andWhere('n.recipient_roles LIKE :role', {
        role: `%${filters.recipientRole}%`,
      });
    }

    if (filters?.readStatus !== undefined) {
      query.andWhere('n.read_status = :readStatus', { readStatus: filters.readStatus });
    }

    if (filters?.type) {
      query.andWhere('n.type = :type', { type: filters.type });
    }

    if (filters?.relatedEntityType) {
      query.andWhere('n.related_entity_type = :relatedEntityType', {
        relatedEntityType: filters.relatedEntityType,
      });
    }

    if (filters?.relatedEntityId) {
      query.andWhere('n.related_entity_id = :relatedEntityId', {
        relatedEntityId: filters.relatedEntityId,
      });
    }

    query.orderBy('n.timestamp', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async update(id: string, updateDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);

    Object.assign(notification, updateDto);

    const updated = await this.notificationRepository.save(notification);
    this.logger.log(`Updated notification ${id}`);

    return updated;
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.readStatus = true;

    const updated = await this.notificationRepository.save(notification);
    this.logger.log(`Marked notification ${id} as read`);

    return updated;
  }

  async markMultipleAsRead(ids: string[]): Promise<void> {
    await this.notificationRepository.update(
      { id: In(ids) },
      { readStatus: true },
    );

    this.logger.log(`Marked ${ids.length} notifications as read`);
  }

  async markAllAsRead(recipientRole?: NotificationRecipientRole): Promise<void> {
    const query = this.notificationRepository.createQueryBuilder()
      .update(Notification)
      .set({ readStatus: true })
      .where('read_status = :readStatus', { readStatus: false });

    if (recipientRole) {
      query.andWhere('recipient_roles LIKE :role', { role: `%${recipientRole}%` });
    }

    await query.execute();

    this.logger.log(`Marked all notifications as read${recipientRole ? ` for role ${recipientRole}` : ''}`);
  }

  async remove(id: string): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
    this.logger.log(`Deleted notification ${id}`);
  }

  async getUnreadCount(recipientRole?: NotificationRecipientRole): Promise<number> {
    const query = this.notificationRepository.createQueryBuilder('n')
      .where('n.read_status = :readStatus', { readStatus: false });

    if (recipientRole) {
      query.andWhere('n.recipient_roles LIKE :role', { role: `%${recipientRole}%` });
    }

    return query.getCount();
  }
}
