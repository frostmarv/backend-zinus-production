// src/modules/notification/notification.service.ts
import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common'; // Tambahkan Inject
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
// Import enum Department dan Role
import { Department } from '../../common/enums/department.enum';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly firebaseService: FirebaseService,
    private readonly fonnteService: FonnteService, // Tambahkan
    private readonly userService: UserService, // Tambahkan
  ) {}

  /**
   * Simpan notifikasi ke database DAN kirim push via FCM
   */
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

    // Kirim FCM
    await this.sendPushNotification(saved);

    return saved;
  }

  /**
   * Mapping department ke FCM topic
   */
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
      // extend mapping bila ada department lain
    }

    return Array.from(topics);
  }

  /**
   * Kirim push notification via FCM
   */
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

      // buat data payload sebagai string values (FCM data harus string)
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
        // messaging.send expects a single message object; sertakan notification + data + topic
        await this.firebaseService.messaging.send({
          notification: {
            title: notification.title,
            body: notification.message,
          },
          data: dataPayload, // ✅ Perbaikan: gunakan 'data' bukan 'dataPayload'
          topic: topic, // ✅ Perbaikan: tambahkan topic di sini
        });

        this.logger.log(`✅ FCM sent to topic: ${topic}`);
      }
    } catch (error) {
      // Logger yang lebih informatif
      this.logger.error(
        `❌ Failed to send FCM: ${error?.stack || error?.message || error}`,
      );
    }
  }

  // ────────────────────────────────────────
  // 🔔 NOTIFIKASI KHUSUS: BONDING → CUTTING
  // ────────────────────────────────────────

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

  // ────────────────────────────────────────
  // 🔔 TAMBAHAN: KIRIM WHATSAPP KE USER TERTENTU
  // ────────────────────────────────────────

  /**
   * Kirim WhatsApp ke user tertentu berdasarkan departemen (enum) dan role (enum)
   */
  async sendWhatsAppToUsersInDepartment(
    departmentEnum: Department, // Terima enum Department
    rolesEnum: Role[], // Terima enum Role
    message: string,
  ): Promise<void> {
    const users = await this.userService.findUsersByDepartmentAndRoles(
      departmentEnum, // Kirim enum langsung
      rolesEnum, // Kirim enum langsung
    );

    if (users.length === 0) {
      this.logger.warn(
        `Tidak ada user ditemukan di departemen ${departmentEnum} dengan role: ${rolesEnum.join(', ')}`, // Tampilkan enum
      );
      return;
    }

    for (const user of users) {
      try {
        // Nomor Hp dari user entity adalah `nomorHp`
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

  // ────────────────────────────────────────
  // 🔔 NOTIFIKASI KHUSUS: CUTTING → BONDING
  // ────────────────────────────────────────

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

  // ────────────────────────────────────────
  // 📚 CRUD & QUERY — KOMPATIBEL UNTUK SPASI DI DEPARTMENT
  // ────────────────────────────────────────

  async findAll(filters?: {
    recipientDepartment?: NotificationRecipientDepartment;
    readStatus?: boolean;
    type?: NotificationType;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<Notification[]> {
    const query = this.notificationRepository.createQueryBuilder('n');

    // Filter berdasarkan department (recipientDepartments disimpan sebagai text/array -> gunakan LIKE hack untuk sqlite)
    if (filters?.recipientDepartment) {
      const escapedDept = String(filters.recipientDepartment).replace(
        /'/g,
        "''",
      ); // Escape single quote
      query.andWhere(`(',' || n.recipientDepartments || ',') LIKE :pattern`, {
        pattern: `%,${escapedDept},%`,
      });
    }

    if (filters?.readStatus !== undefined) {
      query.andWhere('n.readStatus = :readStatus', {
        readStatus: filters.readStatus,
      });
    }

    if (filters?.type) {
      query.andWhere('n.type = :type', { type: filters.type });
    }

    if (filters?.relatedEntityType) {
      query.andWhere('n.relatedEntityType = :relatedEntityType', {
        relatedEntityType: filters.relatedEntityType,
      });
    }

    if (filters?.relatedEntityId) {
      query.andWhere('n.relatedEntityId = :relatedEntityId', {
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

  async update(
    id: string,
    updateDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateDto);
    return this.notificationRepository.save(notification);
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.readStatus = true;
    return this.notificationRepository.save(notification);
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
      .where('readStatus = :readStatus', { readStatus: false });

    if (recipientDepartment) {
      const escapedDept = String(recipientDepartment).replace(/'/g, "''");
      query.andWhere(`(',' || recipientDepartments || ',') LIKE :pattern`, {
        pattern: `%,${escapedDept},%`,
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
      .where('n.readStatus = :readStatus', { readStatus: false });

    if (recipientDepartment) {
      const escapedDept = String(recipientDepartment).replace(/'/g, "''");
      query.andWhere(`(',' || n.recipientDepartments || ',') LIKE :pattern`, {
        pattern: `%,${escapedDept},%`,
      });
    }

    return query.getCount();
  }
}
