// src/services/google-drive.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getDriveService } from '../config/googleDrive.config';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { drive_v3 } from 'googleapis';

interface DriveUploadResult {
  id: string;
  webViewLink: string;
  webContentLink?: string;
}

interface DepartmentConfig {
  code: string;
  folderName: string;
}

interface DriveConfig {
  ROOT_FOLDER_NAME: string;
  SHARED_DRIVE_ID: string;
  DEPARTMENTS: Record<string, DepartmentConfig>;
  SERVICE_ACCOUNT_PATH: string;
  DEFAULT_PUBLIC_PERMISSION: boolean;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly config: DriveConfig;
  private readonly SHARED_DRIVE_ID: string;
  private readonly ROOT_FOLDER_NAME: string;
  private readonly DEFAULT_PUBLIC_PERMISSION: boolean;

  constructor() {
    const configPath = path.join(process.cwd(), 'config', 'drive-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found at ${configPath}`);
    }
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    this.config = JSON.parse(rawConfig);

    this.SHARED_DRIVE_ID = this.config.SHARED_DRIVE_ID;
    this.ROOT_FOLDER_NAME = this.config.ROOT_FOLDER_NAME;
    this.DEFAULT_PUBLIC_PERMISSION = this.config.DEFAULT_PUBLIC_PERMISSION;
  }

  private bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  async findFolder(
    folderName: string,
    parentId: string,
  ): Promise<string | null> {
    const drive = await getDriveService();

    try {
      const response = await drive.files.list({
        q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        fields: 'files(id, name)',
      });

      const folder = response.data.files?.[0];
      return folder?.id ?? null;
    } catch (error) {
      this.logger.error(`Failed to search folder: ${error.message}`);
      throw new InternalServerErrorException(
        `Error searching folder: ${error.message}`,
      );
    }
  }

  async createFolder(
    folderName: string,
    parentId: string,
  ): Promise<{ id: string; name: string }> {
    const drive = await getDriveService();

    try {
      const fileMeta = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      };

      const response = await drive.files.create({
        requestBody: fileMeta,
        supportsAllDrives: true,
        fields: 'id, name',
      });

      const folder = response.data;

      if (!folder.id || !folder.name) {
        throw new InternalServerErrorException(
          'Google Drive returned folder without id or name',
        );
      }

      return { id: folder.id, name: folder.name };
    } catch (error) {
      this.logger.error(`Failed to create folder: ${error.message}`);
      throw new InternalServerErrorException(
        `Error creating folder: ${error.message}`,
      );
    }
  }

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

  async createNestedFolder(folderPath: string[]): Promise<string> {
    if (!folderPath || folderPath.length === 0) {
      throw new BadRequestException('Folder path cannot be empty');
    }

    let currentParentId = await this.getOrCreateRootFolder();

    for (const folderName of folderPath) {
      currentParentId = await this.getOrCreateFolder(
        folderName,
        currentParentId,
      );
    }

    return currentParentId;
  }

  async getOrCreateRootFolder(): Promise<string> {
    const drive = await getDriveService();

    try {
      const response = await drive.files.list({
        q: `name='${this.ROOT_FOLDER_NAME}' and trashed=false`,
        corpora: 'drive',
        driveId: this.SHARED_DRIVE_ID,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'files(id, name)',
      });

      const rootFolder = response.data.files?.[0];
      if (rootFolder?.id) {
        this.logger.log(
          `📁 Root folder '${this.ROOT_FOLDER_NAME}' found in Shared Drive`,
        );
        return rootFolder.id;
      }

      // ✅ CORRECT WAY TO CREATE A FOLDER IN A SHARED DRIVE
      const fileMetadata: drive_v3.Schema$File = {
        name: this.ROOT_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.SHARED_DRIVE_ID], // Parent is the Shared Drive ID
      };

      const responseCreate = await drive.files.create({
        requestBody: fileMetadata,
        supportsAllDrives: true,
        fields: 'id, name',
      });

      const created = responseCreate.data;
      if (!created.id) {
        throw new InternalServerErrorException(
          'Failed to create root folder in Shared Drive',
        );
      }

      this.logger.log(
        `📁 Root folder '${this.ROOT_FOLDER_NAME}' created in Shared Drive`,
      );
      return created.id;
    } catch (error) {
      this.logger.error(
        `Failed to get or create root folder: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Error initializing root folder: ${error.message}`,
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    parentFolderId: string,
    options?: { public?: boolean },
  ): Promise<DriveUploadResult> {
    const drive = await getDriveService();
    const publicPermission = options?.public ?? this.DEFAULT_PUBLIC_PERMISSION;

    try {
      const uniqueFileName = `${uuidv4()}${this.getExtension(file.originalname)}`;
      const fileMeta = {
        name: uniqueFileName,
        parents: [parentFolderId],
      };

      let mediaStream: Readable;
      if (file.buffer) {
        mediaStream = this.bufferToStream(file.buffer);
      } else if (file.path) {
        mediaStream = fs.createReadStream(file.path);
      } else {
        throw new BadRequestException('File does not have buffer or path');
      }

      const media: drive_v3.Params$Resource$Files$Create['media'] = {
        mimeType: file.mimetype,
        body: mediaStream,
      };

      const response = await drive.files.create({
        requestBody: fileMeta,
        media: media,
        supportsAllDrives: true,
        fields: 'id, webViewLink, webContentLink',
      });

      const uploadedFile = response.data;
      if (!uploadedFile.id) {
        throw new InternalServerErrorException('Uploaded file missing ID');
      }

      if (publicPermission) {
        await this.ensurePermissions(uploadedFile.id);
      }

      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        id: uploadedFile.id,
        webViewLink: uploadedFile.webViewLink ?? '',
        webContentLink: uploadedFile.webContentLink,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new InternalServerErrorException(
        `Error uploading file: ${error.message}`,
      );
    }
  }

  async ensurePermissions(
    fileId: string,
    role: 'reader' | 'writer' = 'reader',
    type: 'anyone' = 'anyone',
  ): Promise<void> {
    const drive = await getDriveService();

    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role, type },
        supportsAllDrives: true,
      });
    } catch (error) {
      this.logger.error(
        `Failed to set permissions for file ${fileId}: ${error.message}`,
      );
    }
  }

  private getExtension(filename: string): string {
    const ext = filename.split('.').pop();
    return ext ? `.${ext}` : '';
  }

  async uploadBondingRejectImages(
    batchNumber: string,
    files: Express.Multer.File[],
  ): Promise<any[]> {
    try {
      const year = dayjs().format('YYYY');
      const month = dayjs().format('MM');

      const rootFolderId = await this.getOrCreateRootFolder();
      const bondingRejectFolderId = await this.getOrCreateFolder(
        'Bonding-Reject',
        rootFolderId,
      );
      const yearFolderId = await this.getOrCreateFolder(
        year,
        bondingRejectFolderId,
      );
      const monthFolderId = await this.getOrCreateFolder(month, yearFolderId);
      const batchFolderId = await this.getOrCreateFolder(
        batchNumber,
        monthFolderId,
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

        const result = await this.uploadFile(file, batchFolderId);
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

  async uploadDocuments(
    departmentKey: string,
    docType: 'NG' | 'PROD',
    shift: 'A' | 'B' | 'C',
    files: Express.Multer.File[],
    serial: number,
  ): Promise<{
    docNumber: string;
    batchFolder: string;
    files: Array<{
      originalName: string;
      storedName: string;
      driveLink: string;
    }>;
  }> {
    const { DEPARTMENTS } = this.config;

    if (!DEPARTMENTS[departmentKey]) {
      throw new BadRequestException(
        `Department key '${departmentKey}' not found in config.`,
      );
    }

    const yyyyMM = dayjs().format('YYYYMM');
    const year = dayjs().format('YYYY');
    const month = dayjs().format('MM');

    const deptConfig = DEPARTMENTS[departmentKey];

    const batchFolderName = `ZDI-${deptConfig.code}-${docType}-${yyyyMM}-${shift}-${String(serial).padStart(3, '0')}`;
    const docNumber = `ZDI/${deptConfig.code}/${docType}/${yyyyMM}-${shift}/${String(serial).padStart(3, '0')}`;

    const folderPath = [
      this.ROOT_FOLDER_NAME,
      deptConfig.folderName,
      docType,
      year,
      month,
      shift,
      batchFolderName,
    ];

    const batchFolderId = await this.createNestedFolder(folderPath);

    const uploadResults = [];
    for (const file of files) {
      const result = await this.uploadFile(file, batchFolderId);
      uploadResults.push({
        originalName: file.originalname,
        storedName: result.id,
        driveLink: result.webViewLink,
      });
    }

    this.logger.log(
      `✅ Uploaded ${files.length} files to ${batchFolderName} (${docNumber})`,
    );

    return {
      docNumber,
      batchFolder: batchFolderName,
      files: uploadResults,
    };
  }
}
