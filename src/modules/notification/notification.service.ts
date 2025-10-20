// src/modules/notification/notification.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationRecipientDepartment,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FirebaseService } from '../../common/firebase/firebase.service';
import { FonnteService } from '../whatsapp/fonnte.service';
import { UserService } from '../auth/user/user.service';
import { Department } from '../../common/enums/department.enum';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly firebaseService: FirebaseService,
    private readonly fonnteService: FonnteService,
    private readonly userService: UserService,
  ) {}

  async send(createDto: CreateNotificationDto): Promise<Notification> {
    if (
      !createDto.recipientDepartments ||
      createDto.recipientDepartments.length === 0
    ) {
      throw new Error('At least one recipient department is required');
    }

    this.logger.log(
      `Sending notification: "${createDto.title}" to departments: ${createDto.recipientDepartments.join(
        ', ',
      )}`,
    );

    const notification = this.notificationRepository.create({
      title: createDto.title,
      message: createDto.message,
      recipientDepartments: createDto.recipientDepartments,
      type: createDto.type || NotificationType.INFO,
      link: createDto.link,
      relatedEntityType: createDto.relatedEntityType,
      relatedEntityId: createDto.relatedEntityId,
      readStatus: false,
      timestamp: new Date(),
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`Notification saved with ID: ${saved.id}`);

    await this.sendPushNotification(saved);

    return saved;
  }

  private getFCMTopicForDepartments(
    departments: NotificationRecipientDepartment[],
  ): string[] {
    const topics = new Set<string>();

    for (const dept of departments) {
      if (dept === NotificationRecipientDepartment.CUTTING) {
        topics.add('cutting_team');
      }
      if (dept === NotificationRecipientDepartment.BONDING) {
        topics.add('bonding_team');
      }
    }

    return Array.from(topics);
  }

  private async sendPushNotification(
    notification: Notification,
  ): Promise<void> {
    try {
      const topics = this.getFCMTopicForDepartments(
        notification.recipientDepartments || [],
      );

      if (topics.length === 0) {
        this.logger.warn('No FCM topics matched for notification departments');
        return;
      }

      const dataPayload = {
        type: String(notification.type),
        entityId: notification.relatedEntityId
          ? String(notification.relatedEntityId)
          : '',
        entityType: notification.relatedEntityType || '',
        link: notification.link || '',
        notificationId: notification.id ? String(notification.id) : '',
      };

      for (const topic of topics) {
        await this.firebaseService.messaging.send({
          notification: {
            title: notification.title,
            body: notification.message,
          },
          data: dataPayload,
          topic: topic,
        });

        this.logger.log(`✅ FCM sent to topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to send FCM: ${error?.stack || error?.message || error}`,
      );
    }
  }

  async sendBondingRejectNotification(
    batchNumber: string,
    ngQuantity: number,
    bondingRejectId: string,
  ): Promise<Notification> {
    return this.send({
      title: 'Bonding Reject Baru',
      message: `Batch ${batchNumber} ditolak (${ngQuantity} pcs). Butuh replacement segera.`,
      recipientDepartments: [NotificationRecipientDepartment.CUTTING],
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
      title: 'Permintaan Replacement Dibuat',
      message: `Batch ${sourceBatchNumber} butuh replacement (${requestedQty} pcs).`,
      recipientDepartments: [NotificationRecipientDepartment.CUTTING],
      type: NotificationType.INFO,
      link: `/replacement/${replacementId}`,
      relatedEntityType: 'ReplacementProgress',
      relatedEntityId: replacementId,
    });
  }

  async sendWhatsAppToUsersInDepartment(
    departmentEnum: Department,
    rolesEnum: Role[],
    message: string,
  ): Promise<void> {
    const users = await this.userService.findUsersByDepartmentAndRoles(
      departmentEnum,
      rolesEnum,
    );

    if (users.length === 0) {
      this.logger.warn(
        `Tidak ada user ditemukan di departemen ${departmentEnum} dengan role: ${rolesEnum.join(', ')}`,
      );
      return;
    }

    for (const user of users) {
      try {
        await this.fonnteService.sendWhatsApp(user.nomorHp, message);
        this.logger.log(
          `✅ WhatsApp dikirim ke ${user.nama} (${user.nomorHp})`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Gagal kirim WhatsApp ke ${user.nomorHp}: ${error.message}`,
        );
      }
    }
  }

  async sendReplacementUpdateNotification(
    replacementId: string,
    sourceBatchNumber: string,
    processedThisTime: number,
    currentTotalProcessed: number,
    totalQty: number,
  ): Promise<Notification> {
    return this.send({
      title: 'Update Proses Replacement',
      message: `Batch ${sourceBatchNumber}: ${processedThisTime} unit baru diproses. Total saat ini: ${currentTotalProcessed}/${totalQty}.`,
      recipientDepartments: [NotificationRecipientDepartment.BONDING],
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
    totalQty: number,
  ): Promise<Notification> {
    return this.send({
      title: 'Replacement Selesai',
      message: `NG batch ${sourceBatchNumber} selesai diproses (${processedQty}/${totalQty}).`,
      recipientDepartments: [NotificationRecipientDepartment.BONDING],
      type: NotificationType.SUCCESS,
      link: `/replacement/${replacementId}`,
      relatedEntityType: 'ReplacementProgress',
      relatedEntityId: replacementId,
    });
  }

  async sendReplacementPartialNotification(
    replacementId: string,
    sourceBatchNumber: string,
    processedQty: number,
    remainingQty: number,
  ): Promise<Notification> {
    return this.send({
      title: 'Replacement Partial',
      message: `Batch ${sourceBatchNumber}: ${processedQty} diproses, sisa ${remainingQty} perlu diproses.`,
      recipientDepartments: [NotificationRecipientDepartment.BONDING],
      type: NotificationType.WARNING,
      link: `/replacement/${replacementId}`,
      relatedEntityType: 'ReplacementProgress',
      relatedEntityId: replacementId,
    });
  }

  async findAll(filters?: {
    recipientDepartment?: NotificationRecipientDepartment;
    readStatus?: boolean;
    type?: NotificationType;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<Notification[]> {
    const query = this.notificationRepository.createQueryBuilder('n');

    if (filters?.recipientDepartment) {
      // Karena recipientDepartments disimpan sebagai JSON string, gunakan JSON operator
      query.andWhere("n.recipient_departments::jsonb ? :dept", {
        dept: filters.recipientDepartment,
      });
    }

    if (filters?.readStatus !== undefined) {
      query.andWhere('n.read_status = :readStatus', {
        readStatus: filters.readStatus,
      });
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
    return await query.getMany();
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

  async update(
    id: string,
    updateDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateDto);
    return await this.notificationRepository.save(notification);
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.readStatus = true;
    return await this.notificationRepository.save(notification);
  }

  async markMultipleAsRead(ids: string[]): Promise<void> {
    await this.notificationRepository.update(
      { id: In(ids) },
      { readStatus: true },
    );
  }

  async markAllAsRead(
    recipientDepartment?: NotificationRecipientDepartment,
  ): Promise<void> {
    const query = this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ readStatus: true })
      .where('read_status = :readStatus', { readStatus: false });

    if (recipientDepartment) {
      query.andWhere("recipient_departments::jsonb ? :dept", {
        dept: recipientDepartment,
      });
    }

    await query.execute();
  }

  async remove(id: string): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
  }

  async getUnreadCount(
    recipientDepartment?: NotificationRecipientDepartment,
  ): Promise<number> {
    const query = this.notificationRepository
      .createQueryBuilder('n')
      .where('n.read_status = :readStatus', { readStatus: false });

    if (recipientDepartment) {
      query.andWhere("n.recipient_departments::jsonb ? :dept", {
        dept: recipientDepartment,
      });
    }

    return await query.getCount();
  }
}