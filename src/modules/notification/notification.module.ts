// src/modules/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { FirebaseModule } from '../../common/firebase/firebase.module'; // ✅ pastikan path ini sesuai struktur kamu
import { WhatsappModule } from '../whatsapp/whatsapp.module'; // Import module yang menyediakan FonnteService
import { AuthModule } from '../auth/auth.module'; // Import module yang menyediakan UserService

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    FirebaseModule, // ✅ tambahkan ini agar FirebaseService bisa diinject
    WhatsappModule, // ✅ tambahkan ini agar FonnteService bisa diinject
    AuthModule, // ✅ tambahkan ini agar UserService bisa diinject
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
