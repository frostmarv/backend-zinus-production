# Google Sheets Integration - Bonding Department

## Overview

Setiap kali ada input produksi bonding melalui endpoint `POST /bonding/summary/form-input`, data akan **otomatis dikirim ke Google Sheets** untuk tracking dan reporting.

## Flow

```
Flutter App → Backend API → Database (bonding_summary)
                         ↓
                   Google Sheets (Bonding Summary)
```

## Data yang Dikirim ke Google Sheets

Setiap row di Google Sheets berisi kolom:

| Column | Source | Example |
|--------|--------|---------|
| Timestamp | `timestamp` | 2025-01-07T15:00:00.000Z |
| Shift | `shift` | 1 |
| Group | `group` | A |
| Time Slot | `time_slot` | 08.00 - 09.00 |
| Machine | `machine` | Machine-1 |
| Kashift | `kashift` | Noval |
| Admin | `admin` | Aline |
| Customer | `customer` | WMT US STORE |
| PO Number | `po_number` | 0879611929 |
| Customer PO | `customer_po` | 0879611929 |
| SKU | `sku` | SPT-STR-800F |
| Quantity Produksi | `quantity_produksi` | 100 |

## Konfigurasi

### 1. Spreadsheet ID

Edit di `src/services/google-sheets.service.ts`:

```typescript
bonding: {
  summary: {
    spreadsheetId: '1XcfiI5CgS8PmuprcM4u6zV-_PRsN09W9X_-v0nuZKC0', // ⚠️ Ganti dengan ID spreadsheet bonding
    sheetName: 'Bonding Summary',
  },
},
```

**Cara mendapatkan Spreadsheet ID:**
- Buka Google Sheets
- URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
- Copy bagian `{SPREADSHEET_ID}`

### 2. Sheet Name

Pastikan sheet dengan nama **"Bonding Summary"** sudah ada di spreadsheet.

**Header yang disarankan (Row 1):**
```
Timestamp | Shift | Group | Time Slot | Machine | Kashift | Admin | Customer | PO Number | Customer PO | SKU | Quantity Produksi
```

### 3. Service Account

Pastikan file `src/config/service-account.json` sudah ada dan valid.

**Permissions:**
- Service account email harus diberi akses **Editor** ke spreadsheet
- Share spreadsheet dengan email: `{service-account}@{project-id}.iam.gserviceaccount.com`

## Testing

### 1. Test Input Bonding

```bash
curl -X POST http://localhost:5000/bonding/summary/form-input \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-01-07T15:00:00.000Z",
    "shift": "1",
    "group": "A",
    "time_slot": "08.00 - 09.00",
    "machine": "Machine-1",
    "kashift": "Noval",
    "admin": "Aline",
    "customer": "WMT US STORE",
    "po_number": "0879611929",
    "customer_po": "0879611929",
    "sku": "SPT-STR-800F",
    "quantity_produksi": 100
  }'
```

### 2. Cek Log

Backend akan menampilkan log:

**Success:**
```
✅ 1 baris dikirim ke Bonding Summary
```

**Warning (jika gagal):**
```
⚠️ Gagal kirim ke Google Sheets (Bonding Summary): [error message]
```

### 3. Verifikasi di Google Sheets

- Buka spreadsheet
- Cek sheet "Bonding Summary"
- Row baru harus muncul dengan data yang dikirim

## Error Handling

Integrasi Google Sheets bersifat **opsional** dan **non-blocking**:

- ✅ Jika berhasil: Data masuk ke database DAN Google Sheets
- ⚠️ Jika gagal: Data tetap masuk ke database, hanya log warning

**Alasan:**
- Tidak mengganggu proses produksi jika Google Sheets down
- Data tetap aman di database
- Bisa di-sync ulang nanti jika perlu

## Common Issues

### Issue 1: "Service account file tidak ditemukan"

**Solution:**
```bash
# Pastikan file ada
ls src/config/service-account.json

# Jika tidak ada, download dari Google Cloud Console
# Project → IAM & Admin → Service Accounts → Keys → Add Key
```

### Issue 2: "Permission denied"

**Solution:**
- Buka Google Sheets
- Click "Share"
- Add service account email dengan role "Editor"
- Email format: `{name}@{project-id}.iam.gserviceaccount.com`

### Issue 3: "Sheet not found"

**Solution:**
- Pastikan sheet name di config sama dengan di spreadsheet
- Case sensitive: "Bonding Summary" ≠ "bonding summary"

### Issue 4: "Spreadsheet ID salah"

**Solution:**
- Cek URL spreadsheet
- Copy ID yang benar
- Update di `google-sheets.service.ts`

## Architecture

```typescript
// Controller
@Post('form-input')
async createSummary(dto) {
  // 1. Save to database
  const result = await this.bondingService.createSummary(dto);
  
  // 2. Send to Google Sheets (non-blocking)
  try {
    await this.sheetsService.appendToDepartmentSheet('bonding', 'summary', [row]);
  } catch (error) {
    console.warn('⚠️ Gagal kirim ke Google Sheets');
    // Don't throw - continue execution
  }
  
  return result;
}
```

## Comparison with Cutting

| Aspect | Cutting | Bonding |
|--------|---------|---------|
| Sheets | 2 (Summary, Balok) | 1 (Summary) |
| Endpoint | `/cutting` & `/cutting/production` | `/bonding/summary/form-input` |
| Data Complexity | Multiple entries per request | Single entry per request |
| Spreadsheet ID | Same for both sheets | Single sheet |

## Future Enhancements

### 1. Batch Insert
Jika ada multiple entries, kirim sekaligus untuk efisiensi:
```typescript
await this.sheetsService.appendToDepartmentSheet('bonding', 'summary', rows);
```

### 2. Retry Mechanism
Tambahkan retry jika gagal kirim:
```typescript
for (let i = 0; i < 3; i++) {
  try {
    await this.sheetsService.appendToDepartmentSheet(...);
    break;
  } catch (error) {
    if (i === 2) console.warn('⚠️ Gagal setelah 3x retry');
  }
}
```

### 3. Queue System
Gunakan queue (Bull, BullMQ) untuk async processing:
```typescript
await this.queueService.add('sheets-sync', { department: 'bonding', data: row });
```

## Summary

✅ **Automatic**: Data otomatis ke Google Sheets setiap input
✅ **Non-blocking**: Tidak mengganggu proses jika gagal
✅ **Consistent**: Format sama dengan cutting department
✅ **Scalable**: Mudah ditambahkan untuk department lain

---

**Next Steps:**
1. Ganti `spreadsheetId` dengan ID spreadsheet bonding yang sebenarnya
2. Pastikan service account punya akses ke spreadsheet
3. Test dengan input data bonding
4. Verifikasi data muncul di Google Sheets
