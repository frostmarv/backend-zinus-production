import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GoogleDriveService } from '../services/google-drive.service';
import { generateDocNumber } from '../utils/document-control.util';
import * as dayjs from 'dayjs';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Controller('documents')
export class DocumentController {
  constructor(private readonly driveService: GoogleDriveService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
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

    // Struktur folder: category/year/month
    const categoryFolder = await this.driveService.createFolder(category);
    const yearFolder = await this.driveService.createFolder(year, categoryFolder.id);
    const monthFolder = await this.driveService.createFolder(month, yearFolder.id);

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
