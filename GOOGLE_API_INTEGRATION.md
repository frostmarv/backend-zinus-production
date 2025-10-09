# Google API Integration - Unified Configuration

## 🎯 Tujuan

Menyatukan konfigurasi Google Sheets dan Google Drive agar menggunakan 1 service account yang sama.

---

## 📋 Struktur Saat Ini

### Google Sheets
- **File:** `src/config/service-account.json`
- **Scope:** `https://www.googleapis.com/auth/spreadsheets`
- **Digunakan oleh:** `GoogleSheetsService`

### Google Drive
- **File:** `src/config/drive-credentials.json`
- **Scope:** `https://www.googleapis.com/auth/drive.file`
- **Digunakan oleh:** `GoogleDriveService`

### ⚠️ Masalah
- Menggunakan 2 file credentials berbeda
- Duplikasi konfigurasi
- Sulit maintenance

---

## ✅ Solusi: Unified Configuration

### 1. Gunakan 1 Service Account

**File:** `src/config/service-account.json` (sudah ada)

**Scopes yang dibutuhkan:**
```json
[
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file"
]
```

### 2. Update Google Drive Config

**File:** `src/config/googleDrive.config.ts`

```typescript
import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

// ✅ Gunakan service-account.json yang sama
const CREDENTIALS_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets', // Tambahkan ini
];

export async function getDriveService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

// ✅ Tambahkan fungsi untuk Sheets
export async function getSheetsService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}
```

### 3. Update Google Sheets Service

**File:** `src/services/google-sheets.service.ts`

Tidak perlu diubah, sudah menggunakan `service-account.json`.

### 4. Hapus File Duplikat

```bash
# Hapus drive-credentials.json (tidak dipakai lagi)
rm src/config/drive-credentials.json
```

---

## 🔗 Integrasi dengan Bonding NG Workflow

### Opsi 1: Auto-Log ke Google Sheets (Recommended)

Setiap kali bonding NG dibuat, otomatis log ke Google Sheets.

**Update:** `src/modules/bonding-reject/bonding-reject.controller.ts`

```typescript
import { GoogleSheetsService } from '../../services/google-sheets.service';

@Controller('bonding/reject')
export class BondingRejectController {
  constructor(
    private readonly bondingRejectService: BondingRejectService,
    private readonly replacementService: ReplacementService,
    private readonly notificationService: NotificationService,
    private readonly googleSheetsService: GoogleSheetsService, // ✅ Tambahkan ini
  ) {}

  @Post('form-input')
  async createReject(@Body() createDto: CreateBondingRejectDto) {
    // 1. Create bonding reject
    const bondingReject = await this.bondingRejectService.create(createDto);

    // 2. Create replacement
    const replacement = await this.replacementService.createRequest({...});

    // 3. Update status
    await this.bondingRejectService.updateStatus(...);

    // 4. Send notifications
    await this.notificationService.sendBondingRejectNotification(...);

    // ✅ 5. Log to Google Sheets
    try {
      await this.googleSheetsService.appendToDepartmentSheet(
        'bonding',
        'ng_log',
        [[
          bondingReject.batchNumber,
          bondingReject.timestamp.toISOString(),
          bondingReject.shift,
          bondingReject.group,
          bondingReject.machine,
          bondingReject.customer,
          bondingReject.sku,
          bondingReject.ngQuantity,
          bondingReject.reason,
          bondingReject.status,
        ]]
      );
    } catch (error) {
      // Log error tapi jangan block proses utama
      console.error('Failed to log to Google Sheets:', error);
    }

    return {
      success: true,
      message: 'Bonding reject record created and logged to Google Sheets',
      data: { bondingReject, replacement },
    };
  }
}
```

### Opsi 2: Manual Export Endpoint

Buat endpoint khusus untuk export data ke Google Sheets.

**Tambahkan endpoint baru:**

```typescript
@Post('export-to-sheets')
async exportToSheets(
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  const filters: any = {};
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) filters.endDate = new Date(endDate);

  const records = await this.bondingRejectService.findAll(filters);

  const rows = records.map(record => [
    record.batchNumber,
    record.timestamp.toISOString(),
    record.shift,
    record.group,
    record.machine,
    record.customer,
    record.sku,
    record.ngQuantity,
    record.reason,
    record.status,
  ]);

  await this.googleSheetsService.appendToDepartmentSheet(
    'bonding',
    'ng_log',
    rows
  );

  return {
    success: true,
    message: `${rows.length} records exported to Google Sheets`,
    count: rows.length,
  };
}
```

---

## 📊 Update Sheet Configuration

**File:** `src/config/sheet-config.json`

```json
{
  "SPREADSHEET_MASTER": "abcd1234efgh5678ijkl90",
  "departments": {
    "cutting": {
      "summary": {
        "sheetName": "Summary",
        "spreadsheetId": "1XcfiI5CgS8PmuprcM4u6zV-_PRsN09W9X_-v0nuZKC0"
      },
      "balok": {
        "sheetName": "Balok",
        "spreadsheetId": "1XcfiI5CgS8PmuprcM4u6zV-_PRsN09W9X_-v0nuZKC0"
      }
    },
    "bonding": {
      "ng_log": {
        "sheetName": "NG Log",
        "spreadsheetId": "YOUR_BONDING_SPREADSHEET_ID"
      },
      "summary": {
        "sheetName": "Bonding Summary",
        "spreadsheetId": "YOUR_BONDING_SPREADSHEET_ID"
      }
    },
    "replacement": {
      "log": {
        "sheetName": "Replacement Log",
        "spreadsheetId": "YOUR_REPLACEMENT_SPREADSHEET_ID"
      }
    },
    "cutting_replacement": {
      "log": {
        "sheetName": "Cutting Process Log",
        "spreadsheetId": "YOUR_CUTTING_SPREADSHEET_ID"
      }
    }
  }
}
```

**Update:** `src/services/google-sheets.service.ts`

```typescript
@Injectable()
export class GoogleSheetsService {
  private auth: Auth.JWT;
  private readonly logger = new Logger(GoogleSheetsService.name);
  private config: any;

  constructor() {
    this.loadConfig();
    this.initializeAuth();
  }

  private loadConfig() {
    const configPath = path.join(__dirname, '../config/sheet-config.json');
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  // ... rest of the code
}
```

---

## 🔐 Google Cloud Console Setup

### 1. Enable APIs
- ✅ Google Sheets API
- ✅ Google Drive API

### 2. Service Account Permissions

**Scopes yang dibutuhkan:**
```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.file
```

### 3. Share Resources

**Google Sheets:**
- Share spreadsheet dengan service account email
- Permission: Editor

**Google Drive:**
- Share folder dengan service account email
- Permission: Editor

---

## 📝 Update Module Dependencies

**File:** `src/modules/bonding-reject/bonding-reject.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BondingReject } from './entities/bonding-reject.entity';
import { BondingRejectService } from './bonding-reject.service';
import { BondingRejectController } from './bonding-reject.controller';
import { ReplacementModule } from '../replacement/replacement.module';
import { NotificationModule } from '../notification/notification.module';
import { GoogleSheetsService } from '../../services/google-sheets.service'; // ✅ Import

@Module({
  imports: [
    TypeOrmModule.forFeature([BondingReject]),
    ReplacementModule,
    NotificationModule,
  ],
  controllers: [BondingRejectController],
  providers: [
    BondingRejectService,
    GoogleSheetsService, // ✅ Tambahkan provider
  ],
  exports: [BondingRejectService],
})
export class BondingRejectModule {}
```

---

## 🧪 Testing

### Test Google Sheets Integration

```bash
# 1. Create bonding NG (auto-log to sheets)
curl -X POST http://localhost:5000/api/bonding/reject/form-input \
  -H "Content-Type: application/json" \
  -d '{
    "shift": "A",
    "group": "A",
    "timeSlot": "08:00-16:00",
    "machine": "BND-01",
    "kashift": "John Doe",
    "admin": "Jane Smith",
    "customer": "ACME Corp",
    "poNumber": "PO-2025-001",
    "customerPo": "CUST-PO-123",
    "sku": "SKU-12345",
    "sCode": "S-001",
    "ngQuantity": 100,
    "reason": "Adhesive defect"
  }'

# 2. Manual export (if using Opsi 2)
curl -X POST http://localhost:5000/api/bonding/reject/export-to-sheets?startDate=2025-01-01
```

### Verify in Google Sheets

1. Open spreadsheet
2. Check "NG Log" sheet
3. Verify data appears

---

## 📊 Google Sheets Format

### NG Log Sheet

| Batch Number | Timestamp | Shift | Group | Machine | Customer | SKU | NG Qty | Reason | Status |
|--------------|-----------|-------|-------|---------|----------|-----|--------|--------|--------|
| BND-20250109-A-A-0001 | 2025-01-09T10:00:00Z | A | A | BND-01 | ACME | SKU-001 | 100 | Adhesive defect | REPLACEMENT_REQUESTED |

### Replacement Log Sheet

| Replacement ID | Source Dept | Target Dept | Batch Number | Requested Qty | Processed Qty | Status | Created At |
|----------------|-------------|-------------|--------------|---------------|---------------|--------|------------|
| uuid-1 | BONDING | CUTTING | BND-20250109-A-A-0001 | 100 | 50 | IN_PROGRESS | 2025-01-09T10:00:00Z |

### Cutting Process Log Sheet

| Process ID | Replacement ID | Processed Qty | Operator | Machine | Status | Started At | Completed At |
|------------|----------------|---------------|----------|---------|--------|------------|--------------|
| uuid-1 | uuid-2 | 100 | Bob Wilson | CUT-01 | COMPLETED | 2025-01-09T10:30:00Z | 2025-01-09T11:00:00Z |

---

## 🎯 Rekomendasi

### Untuk Production

**Gunakan Opsi 1 (Auto-Log):**
- ✅ Real-time logging
- ✅ Tidak perlu manual export
- ✅ Data selalu up-to-date
- ⚠️ Perlu error handling yang baik

**Tambahan:**
- Gunakan queue (Bull/BullMQ) untuk async logging
- Jangan block main process jika Sheets API error
- Implement retry mechanism

### Untuk Development

**Gunakan Opsi 2 (Manual Export):**
- ✅ Lebih mudah testing
- ✅ Tidak perlu setup Sheets di development
- ✅ Export on-demand
- ⚠️ Data tidak real-time

---

## 🔄 Migration Steps

### Step 1: Backup
```bash
# Backup existing credentials
cp src/config/service-account.json src/config/service-account.json.backup
```

### Step 2: Update Scopes

Edit `service-account.json` di Google Cloud Console:
1. Go to IAM & Admin > Service Accounts
2. Select your service account
3. Add scopes:
   - Google Sheets API
   - Google Drive API

### Step 3: Update Code

```bash
# Update googleDrive.config.ts
# Update bonding-reject.module.ts
# Update bonding-reject.controller.ts
# Update sheet-config.json
```

### Step 4: Test

```bash
# Test Sheets integration
npm run start:dev

# Create test record
curl -X POST http://localhost:5000/api/bonding/reject/form-input ...

# Check Google Sheets
```

### Step 5: Cleanup

```bash
# Remove old credentials file
rm src/config/drive-credentials.json
```

---

## 📌 Summary

### Perubahan yang Diperlukan:

1. ✅ **Unify credentials** - Gunakan 1 `service-account.json`
2. ✅ **Update scopes** - Tambahkan Drive scope
3. ✅ **Update googleDrive.config.ts** - Gunakan service-account.json
4. ✅ **Add GoogleSheetsService** ke BondingRejectModule
5. ✅ **Inject GoogleSheetsService** di controller
6. ✅ **Add auto-logging** atau manual export endpoint
7. ✅ **Update sheet-config.json** - Tambahkan bonding config
8. ✅ **Share Sheets** dengan service account email

### Tidak Perlu Diubah:

- ❌ GoogleSheetsService (sudah bagus)
- ❌ Database entities
- ❌ Existing workflow logic
- ❌ Notification system

---

## 🚀 Quick Implementation

Jika ingin implementasi cepat, gunakan **Opsi 1 (Auto-Log)** dengan error handling:

```typescript
// Simple wrapper untuk safe logging
private async logToSheets(data: any) {
  try {
    await this.googleSheetsService.appendToDepartmentSheet(
      'bonding',
      'ng_log',
      [data]
    );
  } catch (error) {
    this.logger.error('Failed to log to Google Sheets:', error);
    // Don't throw - just log error
  }
}
```

Ini memastikan jika Google Sheets error, proses utama tetap jalan.

---

**Kesimpulan:** Struktur saat ini sudah bagus, hanya perlu:
1. Unify credentials (1 file)
2. Inject GoogleSheetsService ke module yang perlu
3. Tambahkan logging di controller

Tidak perlu perubahan besar! 🎉
