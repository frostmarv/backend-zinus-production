// src/services/google-drive.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { getDriveService } from '../config/googleDrive.config';
import fs from 'fs';
import { Readable } from 'stream';
import dayjs from 'dayjs';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly ROOT_FOLDER_ID = '18kSzEb6hl8OCtMsgWwSV_ghszcMK2b31'; // ZinusDreamIndonesia

  /**
   * Convert Buffer to Readable Stream
   */
  private bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  /**
   * Upload file dari Multer (handle memory & disk storage)
   */
  async uploadFile(file: Express.Multer.File, folderId: string) {
    const drive = await getDriveService();

    const fileMetadata = {
      name: file.originalname,
      parents: [folderId],
    };

    // ✅ Handle kedua jenis storage dengan benar
    let mediaStream;
    if (file.buffer) {
      // Memory storage: konversi buffer ke stream
      mediaStream = this.bufferToStream(file.buffer);
    } else if (file.path) {
      // Disk storage: baca dari file path
      mediaStream = fs.createReadStream(file.path);
    } else {
      throw new Error('File tidak memiliki buffer atau path');
    }

    const media = {
      mimeType: file.mimetype,
      body: mediaStream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    // Hapus file lokal hanya jika menggunakan disk storage
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return response.data;
  }

  async createFolder(folderName: string, parentId?: string) {
    const drive = await getDriveService();

    const fileMetadata: any = {
      // ✅ FIX: tambahkan titik dua (:)
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) fileMetadata.parents = [parentId];

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name',
    });

    return folder.data;
  }

  /**
   * Find folder by name in parent folder
   */
  async findFolder(
    folderName: string,
    parentId: string,
  ): Promise<string | null> {
    const drive = await getDriveService();

    const response = await drive.files.list({
      q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    return null;
  }

  /**
   * Get or create folder (if not exists)
   */
  async getOrCreateFolder(
    folderName: string,
    parentId: string,
  ): Promise<string> {
    const existingFolderId = await this.findFolder(folderName, parentId);

    if (existingFolderId) {
      this.logger.log(`📁 Found existing folder: ${folderName}`);
      return existingFolderId;
    }

    this.logger.log(`📁 Creating new folder: ${folderName}`);
    const folder = await this.createFolder(folderName, parentId);
    return folder.id;
  }

  /**
   * Upload bonding reject images with auto folder structure
   */
  async uploadBondingRejectImages(
    batchNumber: string,
    files: Express.Multer.File[],
  ): Promise<any[]> {
    try {
      const year = dayjs().format('YYYY');
      const month = dayjs().format('MM');

      const bondingRejectFolder = await this.getOrCreateFolder(
        'Bonding-Reject',
        this.ROOT_FOLDER_ID,
      );
      const yearFolder = await this.getOrCreateFolder(
        year,
        bondingRejectFolder,
      );
      const monthFolder = await this.getOrCreateFolder(month, yearFolder);
      const batchFolder = await this.getOrCreateFolder(
        batchNumber,
        monthFolder,
      );

      this.logger.log(
        `📁 Folder structure ready: Bonding-Reject/${year}/${month}/${batchNumber}`,
      );

      const uploadResults = [];
      for (const file of files) {
        if (!file || (!file.path && !file.buffer)) {
          this.logger.warn(`⚠️ Skipping invalid file`);
          continue;
        }

        const result = await this.uploadFile(file, batchFolder);

        uploadResults.push({
          filename: file.originalname,
          driveFileId: result.id,
          driveLink: result.webViewLink,
          size: file.size,
        });
      }

      this.logger.log(`✅ Uploaded ${files.length} images to Google Drive`);
      return uploadResults;
    } catch (error) {
      this.logger.error(
        `❌ Failed to upload images to Google Drive: ${error.message}`,
      );
      throw error;
    }
  }
}
