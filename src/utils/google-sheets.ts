// utils/google-sheets.ts
import { google, Auth } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { SheetsConfig, SheetConfig } from '../types';

const CREDENTIALS_PATH = path.join(__dirname, '../config/service-account.json');

let authClient: Auth.JWT | null = null;

async function getAuth(): Promise<Auth.JWT> {
  if (authClient) return authClient;

  try {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    const credentials = JSON.parse(content);

    authClient = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await authClient.authorize();
    console.log('✅ Service account terautentikasi');
    return authClient;
  } catch (error) {
    console.error('❌ Gagal autentikasi service account:', error);
    throw new Error('Gagal koneksi ke Google Sheets API');
  }
}

// Load konfigurasi
const sheetConfig: SheetsConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/sheets-config.json'), 'utf8')
);

/**
 * Kirim data ke Google Sheet berdasarkan department dan type
 */
export async function appendToSheet(
  department: string,
  dataType: string,
  rows: (string | number)[][]
): Promise<void> {
  const config = sheetConfig.departments[department]?.[dataType];

  if (!config) {
    throw new Error(`Konfigurasi tidak ditemukan: ${department}/${dataType}`);
  }

  const { spreadsheetId, sheetName } = config;
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });

    console.log(`✅ [${department}/${dataType}] ${rows.length} baris dikirim ke ${sheetName}`);
  } catch (error: any) {
    console.error(`❌ Gagal kirim ke ${sheetName}:`, error.message);
    throw new Error(`Gagal update sheet: ${error.message}`);
  }
}

// Export config jika perlu
export { sheetConfig };