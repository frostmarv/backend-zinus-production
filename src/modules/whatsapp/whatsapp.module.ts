// src/whatsapp/whatsapp.module.ts
import { Module } from '@nestjs/common';
import { FonnteService } from './fonnte.service';

@Module({
  providers: [FonnteService],
  exports: [FonnteService], // biar bisa dipakai di module lain
})
export class WhatsappModule {}
