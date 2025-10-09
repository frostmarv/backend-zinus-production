import { Injectable, Logger } from '@nestjs/common';
import { getDriveService } from '../config/googleDrive.config';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly ROOT_FOLDER_ID = '18kSzEb6hl8OCtMsgWwSV_ghszcMK2b31'; // ZinusDreamIndonesia

  async uploadFile(file: Express.Multer.File, folderId: string) {
    const drive = await getDriveService();

    const fileMetadata = {
      name: file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    // Hapus file lokal setelah upload
    fs.unlinkSync(file.path);

    return response.data;
  }

  /**
   * Upload file from local path to Google Drive
   */
  async uploadFileFromPath(
    filePath: string,
    fileName: string,
    folderId: string,
    mimeType?: string,
  ) {
    const drive = await getDriveService();

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: mimeType || 'application/octet-stream',
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    this.logger.log(`✅ Uploaded ${fileName} to Google Drive`);

    return response.data;
  }

  async createFolder(folderName: string, parentId?: string) {
    const drive = await getDriveService();

    const fileMetadata: any = {
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
    // Try to find existing folder
    const existingFolderId = await this.findFolder(folderName, parentId);

    if (existingFolderId) {
      this.logger.log(`📁 Found existing folder: ${folderName}`);
      return existingFolderId;
    }

    // Create new folder
    this.logger.log(`📁 Creating new folder: ${folderName}`);
    const folder = await this.createFolder(folderName, parentId);
    return folder.id;
  }

  /**
   * Upload bonding reject images with auto folder structure
   * Structure: ZinusDreamIndonesia/Bonding-Reject/YYYY/MM/batch-number/
   */
  async uploadBondingRejectImages(
    batchNumber: string,
    files: Express.Multer.File[],
  ): Promise<any[]> {
    try {
      const year = dayjs().format('YYYY');
      const month = dayjs().format('MM');

      // Create folder structure: Bonding-Reject/YYYY/MM/batch-number
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

      // Upload all files
      const uploadResults = [];
      for (const file of files) {
        const result = await this.uploadFileFromPath(
          file.path,
          file.originalname,
          batchFolder,
          file.mimetype,
        );

        uploadResults.push({
          filename: file.originalname,
          driveFileId: result.id,
          driveLink: result.webViewLink,
          size: file.size,
        });

        // Delete local file after upload
        fs.unlinkSync(file.path);
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
