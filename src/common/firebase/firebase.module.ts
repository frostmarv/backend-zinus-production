import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Module({
  providers: [FirebaseService],
  exports: [FirebaseService], // <- penting supaya bisa digunakan di module lain
})
export class FirebaseModule {}
