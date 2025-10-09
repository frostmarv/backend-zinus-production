# ✅ Google Sheets Integration - Implementation Complete

## 🎉 What's Been Implemented

### 1. Unified Credentials
- ✅ **Single service account** untuk Google Sheets dan Google Drive
- ✅ File: `src/config/service-account.json`
- ✅ Scopes: Sheets + Drive

### 2. Auto-Logging to Google Sheets
- ✅ **Automatic logging** setiap bonding NG dibuat
- ✅ **Non-blocking** - error tidak mengganggu proses utama
- ✅ **Comprehensive data** - semua field di-log

### 3. Manual Export Endpoint
- ✅ **Bulk export** dengan filter
- ✅ **Date range** support
- ✅ **Status filtering**

---

## 📊 Google Sheets Format

### Sheet: "NG Log"

**Columns:**
1. Batch Number
2. Timestamp
3. Shift
4. Group
5. Time Slot
6. Machine
7. Kashift (Operator)
8. Admin
9. Customer
10. PO Number
11. Customer PO
12. SKU
13. S Code
14. NG Quantity
15. Reason
16. Status

**Example Data:**
```
BND-20250109-A-A-0001 | 2025-01-09T10:00:00Z | A | A | 08:00-16:00 | BND-01 | John Doe | Jane Smith | ACME Corp | PO-2025-001 | CUST-PO-123 | SKU-12345 | S-001 | 100 | Adhesive defect | REPLACEMENT_REQUESTED
```

---

## 🚀 Usage

### Auto-Logging (Automatic)

Setiap kali bonding NG dibuat, otomatis log ke Google Sheets:

```bash
POST /api/bonding/reject/form-input
{
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
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bonding reject record created and replacement request initiated",
  "data": {
    "bondingReject": { ... },
    "replacement": { ... }
  }
}
```

**Background:** Data otomatis di-log ke Google Sheets (non-blocking)

---

### Manual Export

Export data dengan filter:

```bash
POST /api/bonding/reject/export-to-sheets?shift=A&startDate=2025-01-01&endDate=2025-01-31
```

**Query Parameters:**
- `shift` (optional): A or B
- `group` (optional): A or B
- `status` (optional): PENDING, REPLACEMENT_REQUESTED, IN_PROGRESS, COMPLETED, CANCELLED
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date

**Response:**
```json
{
  "success": true,
  "message": "25 records exported to Google Sheets",
  "count": 25
}
```

---

## 🔧 Configuration

### 1. Google Cloud Console Setup

**Enable APIs:**
- ✅ Google Sheets API
- ✅ Google Drive API

**Service Account:**
1. Create service account
2. Download JSON credentials
3. Save as `src/config/service-account.json`

**Scopes Required:**
```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.file
```

### 2. Share Google Sheets

1. Open your Google Sheets spreadsheet
2. Click "Share"
3. Add service account email (from JSON: `client_email`)
4. Give "Editor" permission
5. Copy spreadsheet ID from URL

### 3. Update Configuration

**File:** `src/config/sheet-config.json`

```json
{
  "departments": {
    "bonding": {
      "ng_log": {
        "sheetName": "NG Log",
        "spreadsheetId": "YOUR_SPREADSHEET_ID_HERE"
      }
    }
  }
}
```

**Replace:** `YOUR_SPREADSHEET_ID_HERE` with actual spreadsheet ID

---

## 📝 Sheet Setup

### Create Sheet in Google Sheets

1. **Create new spreadsheet** or use existing
2. **Create sheet** named "NG Log"
3. **Add header row:**

```
Batch Number | Timestamp | Shift | Group | Time Slot | Machine | Kashift | Admin | Customer | PO Number | Customer PO | SKU | S Code | NG Quantity | Reason | Status
```

4. **Share with service account**
5. **Copy spreadsheet ID**
6. **Update sheet-config.json**

---

## 🧪 Testing

### Test Auto-Logging

```bash
# 1. Create bonding NG record
curl -X POST http://localhost:5000/api/bonding/reject/form-input \
  -H "Content-Type: application/json" \
  -d '{
    "shift": "A",
    "group": "A",
    "timeSlot": "08:00-16:00",
    "machine": "BND-01",
    "kashift": "Test Operator",
    "admin": "Test Admin",
    "customer": "Test Customer",
    "poNumber": "TEST-PO-001",
    "customerPo": "TEST-CUST-001",
    "sku": "TEST-SKU-001",
    "sCode": "TEST-S-001",
    "ngQuantity": 50,
    "reason": "Test reason"
  }'

# 2. Check Google Sheets
# Open spreadsheet and verify data appears in "NG Log" sheet

# 3. Check server logs
# Should see: "✅ Logged to Google Sheets: BND-20250109-A-A-0001"
```

### Test Manual Export

```bash
# Export all records
curl -X POST http://localhost:5000/api/bonding/reject/export-to-sheets

# Export with filters
curl -X POST "http://localhost:5000/api/bonding/reject/export-to-sheets?shift=A&startDate=2025-01-01&endDate=2025-01-31"

# Check Google Sheets for exported data
```

---

## 🔍 Troubleshooting

### Issue: "Google Sheets tidak tersedia"

**Solution:**
1. Check `service-account.json` exists in `src/config/`
2. Verify file permissions
3. Check server logs for auth errors

### Issue: "Gagal update sheet"

**Solution:**
1. Verify spreadsheet is shared with service account email
2. Check spreadsheet ID in `sheet-config.json`
3. Verify sheet name matches exactly ("NG Log")
4. Check Google Sheets API is enabled

### Issue: "Konfigurasi tidak ditemukan"

**Solution:**
1. Check `sheet-config.json` exists
2. Verify JSON format is valid
3. Check department and dataType names match

### Issue: Data tidak muncul di Sheets

**Solution:**
1. Check server logs for errors
2. Verify service account has Editor permission
3. Check spreadsheet ID is correct
4. Try manual export to test connection

---

## 📊 Monitoring

### Check Logs

```bash
# Success log
✅ Logged to Google Sheets: BND-20250109-A-A-0001

# Warning log (non-critical)
⚠️ Google Sheets logging failed: Request failed with status code 403

# Error log
❌ Failed to log to Google Sheets: Service account not authorized
```

### Verify Data

1. Open Google Sheets
2. Check "NG Log" sheet
3. Verify latest entries
4. Check timestamp matches

---

## 🎯 Features

### ✅ Auto-Logging
- **Real-time:** Data logged immediately after creation
- **Non-blocking:** Errors don't affect main process
- **Comprehensive:** All fields included
- **Timestamped:** ISO 8601 format

### ✅ Manual Export
- **Bulk export:** Export multiple records at once
- **Filtering:** By shift, group, status, date range
- **On-demand:** Export when needed
- **Validation:** Checks for empty results

### ✅ Error Handling
- **Graceful degradation:** Main process continues on error
- **Detailed logging:** All errors logged
- **User feedback:** Clear error messages
- **Retry-friendly:** Can retry failed exports

---

## 🔐 Security

### Service Account Permissions

**Minimum required:**
- ✅ Spreadsheets: Read & Write
- ✅ Drive: File access only

**Best practices:**
- ❌ Don't commit `service-account.json` to git
- ✅ Add to `.gitignore`
- ✅ Use environment variables in production
- ✅ Rotate keys regularly
- ✅ Limit scope to specific spreadsheets

### .gitignore

```
# Google API credentials
src/config/service-account.json
src/config/drive-credentials.json
```

---

## 📈 Future Enhancements

### Planned Features

1. **Replacement Logging**
   - Auto-log replacement requests
   - Track progress updates
   - Log completion

2. **Cutting Process Logging**
   - Log cutting operations
   - Track operator performance
   - Monitor machine usage

3. **Dashboard Integration**
   - Real-time statistics from Sheets
   - Charts and graphs
   - Trend analysis

4. **Scheduled Reports**
   - Daily summary emails
   - Weekly reports
   - Monthly analytics

5. **Data Validation**
   - Validate data before logging
   - Check for duplicates
   - Verify data integrity

---

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Auth failed | Check service account credentials |
| Sheet not found | Verify sheet name and spreadsheet ID |
| Permission denied | Share spreadsheet with service account |
| API not enabled | Enable Google Sheets API in Console |
| Rate limit | Implement exponential backoff |

### Debug Mode

Enable detailed logging:

```typescript
// In google-sheets.service.ts
this.logger.debug('Attempting to log to sheets:', data);
```

---

## 🎉 Summary

### What Works Now

✅ **Auto-logging** - Every bonding NG automatically logged  
✅ **Manual export** - Bulk export with filters  
✅ **Error handling** - Graceful degradation  
✅ **Unified credentials** - Single service account  
✅ **Non-blocking** - Main process not affected by errors  
✅ **Comprehensive logging** - All fields included  
✅ **Flexible configuration** - Easy to add new sheets  

### Integration Points

1. **Bonding Reject** → Google Sheets ✅
2. **Replacement** → Google Sheets (future)
3. **Cutting Process** → Google Sheets (future)
4. **Notifications** → Google Sheets (future)

### Next Steps

1. ✅ Setup service account
2. ✅ Create Google Sheets
3. ✅ Update sheet-config.json
4. ✅ Test auto-logging
5. ✅ Test manual export
6. ✅ Monitor logs
7. ✅ Verify data in Sheets

---

**Status:** ✅ Ready for Production  
**Last Updated:** January 9, 2025  
**Version:** 1.0.0
