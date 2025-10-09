import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

// ✅ Gunakan service-account.json yang sama dengan Google Sheets
const CREDENTIALS_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

export async function getDriveService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

// ✅ Tambahkan fungsi untuk Sheets (opsional, bisa pakai GoogleSheetsService)
export async function getSheetsService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}
