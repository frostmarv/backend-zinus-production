import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GoogleDriveService } from '../services/google-drive.service'; // Pastikan path benar
import { generateDocNumber } from '../utils/document-control.util';
import dayjs from 'dayjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

@Controller('documents')
export class DocumentController {
  constructor(private readonly driveService: GoogleDriveService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + '-' + file.originalname);
        },
      }),
    }),
  )
  async uploadDocument(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: {
      deptCode: string;
      docType: string;
      shift: string;
      groupCode: string;
      category: string; // contoh: "NG" atau "PROD"
    },
  ) {
    const { deptCode, docType, shift, groupCode, category } = body;

    // Validate group must be A or B only
    if (groupCode !== 'A' && groupCode !== 'B') {
      throw new BadRequestException('Group must be either A or B');
    }

    const docNumber = generateDocNumber(deptCode, docType, shift, groupCode);
    const year = dayjs().format('YYYY');
    const month = dayjs().format('MM');

    // ✅ Perbaikan: Dapatkan parentId dari root folder terlebih dahulu
    const rootFolderId = await this.driveService.getOrCreateRootFolder();

    // ✅ Buat folder 'category' di bawah root
    const categoryFolder = await this.driveService.createFolder(
      category,
      rootFolderId,
    );
    const yearFolder = await this.driveService.createFolder(
      year,
      categoryFolder.id, // ✅ parentId dari categoryFolder
    );
    const monthFolder = await this.driveService.createFolder(
      month,
      yearFolder.id, // ✅ parentId dari yearFolder
    );

    const uploadResults = [];
    for (const file of files) {
      const result = await this.driveService.uploadFile(file, monthFolder.id);
      uploadResults.push({
        docNumber,
        fileName: file.originalname,
        driveLink: result.webViewLink,
      });
    }

    return {
      message: 'Upload success',
      documentNumber: docNumber,
      uploaded: uploadResults,
    };
  }
}
