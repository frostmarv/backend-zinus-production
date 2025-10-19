// src/common/firebase/firebase.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly serviceAccountPath = path.join(
    __dirname,
    '..',
    '..',
    'config',
    'google-services.json', // Pastikan nama file sesuai
  );

  onModuleInit() {
    // Cek apakah file ada
    if (!fs.existsSync(this.serviceAccountPath)) {
      throw new Error(
        `Firebase service account file not found at ${this.serviceAccountPath}`,
      );
    }

    // Inisialisasi Firebase Admin SDK hanya sekali
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(this.serviceAccountPath, 'utf8'),
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('✅ Firebase Admin initialized with service account file');
    }
  }

  get messaging() {
    return admin.messaging();
  }
}
