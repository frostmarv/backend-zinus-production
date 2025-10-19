// src/config/googleDrive.config.ts
import { google } from 'googleapis';
import * as path from 'path';

// ✅ Perbaiki path agar relatif ke root project
const CREDENTIALS_PATH = path.join(
  process.cwd(),
  'config',
  'service-account.json',
);

const SCOPES = [
  'https://www.googleapis.com/auth/drive', // ✅ Akses penuh ke Drive
  'https://www.googleapis.com/auth/spreadsheets', // ✅ Akses ke Sheets
];

export async function getDriveService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

export async function getSheetsService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}
