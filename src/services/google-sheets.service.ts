// src/services/google-sheets.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { google, Auth } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

interface SheetConfig {
  spreadsheetId: string;
  sheetName: string;
}

@Injectable()
export class GoogleSheetsService {
  private auth: Auth.JWT;
  private readonly logger = new Logger(GoogleSheetsService.name);

  // ✅ Konfigurasi internal
  private readonly config = {
    departments: {
      cutting: {
        summary: {
          spreadsheetId: '1XcfiI5CgS8PmuprcM4u6zV-_PRsN09W9X_-v0nuZKC0',
          sheetName: 'Summary',
        },
        balok: {
          spreadsheetId: '1XcfiI5CgS8PmuprcM4u6zV-_PRsN09W9X_-v0nuZKC0',
          sheetName: 'Balok',
        },
      },
      bonding: {
        summary: {
          spreadsheetId: '1XcfiI5CgS8PmuprcM4u6zV-_PRsN09W9X_-v0nuZKC0', // TODO: Ganti dengan spreadsheet ID bonding
          sheetName: 'Bonding Summary',
        },
      },
      // tambahkan assembly, packing, dll nanti
    },
  };

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    const keyPath = path.join(
      __dirname,
      '../config/service-account.json',
    );

    try {
      if (!fs.existsSync(keyPath)) {
        this.logger.warn(`⚠️ Service account file tidak ditemukan: ${keyPath}`);
        this.logger.warn('⚠️ Google Sheets integration akan dinonaktifkan');
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

      this.auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      // Don't block startup with auth
      this.auth.authorize((err) => {
        if (err) {
          this.logger.error('❌ Gagal autentikasi Google Sheets:', err.message);
        } else {
          this.logger.log('✅ Berhasil terhubung ke Google Sheets API');
        }
      });
    } catch (error) {
      this.logger.error('❌ Gagal inisialisasi Google Sheets:', error.message);
      this.logger.warn('⚠️ Google Sheets integration akan dinonaktifkan');
    }
  }

  async appendToSheet(config: SheetConfig, rows: (string | number)[][]) {
    if (!this.auth) {
      this.logger.warn('⚠️ Google Sheets tidak tersedia - melewati update');
      return;
    }

    const sheets = google.sheets({ version: 'v4', auth: this.auth });

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: config.spreadsheetId,
        range: `${config.sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: rows },
      });

      this.logger.log(`✅ ${rows.length} baris dikirim ke ${config.sheetName}`);
    } catch (error: any) {
      this.logger.error(`❌ Gagal update sheet:`, error.message);
      throw error;
    }
  }

  // ✅ Fungsi baru untuk dipakai di controller
  async appendToDepartmentSheet(
    department: string,
    dataType: string,
    rows: (string | number)[][],
  ) {
    const config = this.config.departments[department]?.[dataType];

    if (!config) {
      throw new Error(`Konfigurasi tidak ditemukan: ${department}/${dataType}`);
    }

    return this.appendToSheet(config, rows);
  }
}
