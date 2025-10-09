# Zinus Production - Bonding NG Workflow System

Complete NestJS backend system for managing bonding NG (Not Good) workflow with automatic replacement requests, cutting process tracking, real-time notifications, and Google API integration.

## 🎯 Overview

Sistem ini mengelola alur kerja lengkap dari:
1. **Bonding NG Detection** → Auto-generate batch number
2. **Replacement Request** → Auto-create ke cutting department
3. **Cutting Process** → Track progress dan quantity
4. **Notifications** → Multi-role, real-time alerts
5. **Google Sheets** → Auto-logging semua data
6. **Google Drive** → Document upload dengan auto-folder

---

## ✨ Key Features

### 🔢 Auto-Generated Batch Numbers
```
Format: BND-YYYYMMDD-SHIFT-GROUP-XXXX
Example: BND-20250109-A-A-0001
```
- Sequential numbering per day/shift/group
- Unique constraint enforced
- Automatic generation

### ✅ Group Validation
- **Only A or B allowed** (uppercase)
- Applied to bonding reject and document upload
- Validation at DTO level

### 🔄 Automatic Workflow
```
Bonding NG → Replacement Request → Cutting Process
     ↓              ↓                    ↓
  Database    Auto-created          Auto-synced
     ↓              ↓                    ↓
Google Sheets  Notifications      Notifications
```

### 📊 Google Sheets Integration
- **Auto-logging** setiap bonding NG dibuat
- **Manual export** dengan filter
- **Non-blocking** - error tidak mengganggu proses utama
- **Unified credentials** dengan Google Drive

### 📁 Google Drive Integration
- **Auto-folder creation** (category/year/month)
- **Multi-file upload** (max 10 files)
- **Document control numbers**
- **Automatic cleanup** local files

### 🔔 Smart Notifications
- **Multi-role targeting** (ADMIN, LEADER, OPERATOR, SUPERVISOR)
- **Auto-send** on key events
- **Read/unread tracking**
- **Bulk operations**

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repository
git clone https://github.com/frostmarv/backend-zinus-production.git
cd backend-zinus-production

# Install dependencies
npm install
npm install multer @types/multer uuid dayjs
```

### 2. Database Configuration

**Development (SQLite):**
```env
DB_TYPE=sqlite
DB_DATABASE=dev.sqlite
DB_SYNCHRONIZE=true
DB_LOGGING=true
```

**Production (PostgreSQL):**
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=zinus_production
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

### 3. Google API Setup

#### Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
4. Create service account
5. Download JSON credentials
6. Save as `src/config/service-account.json`

#### Share Resources
1. **Google Sheets:**
   - Share spreadsheet with service account email
   - Give "Editor" permission
   - Copy spreadsheet ID

2. **Google Drive:**
   - Share folder with service account email
   - Give "Editor" permission
   - Copy folder ID

#### Update Configuration

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

### 4. Start Server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server runs on: `http://localhost:5000`

---

## 📖 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Quick Examples

#### 1. Create Bonding NG (Auto-creates Replacement)
```bash
POST /api/bonding/reject/form-input
Content-Type: application/json

{
  "shift": "A",              # A or B only
  "group": "A",              # A or B only
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

**Auto-happens:**
- ✅ Batch number: `BND-20250109-A-A-0001`
- ✅ Replacement request created
- ✅ Notifications sent
- ✅ Logged to Google Sheets

#### 2. Process Replacement (Cutting)
```bash
POST /api/cutting/replacement/process
Content-Type: application/json

{
  "replacementId": "uuid",
  "processedQty": 50,
  "operatorName": "Bob Wilson",
  "machineId": "CUT-01"
}
```

#### 3. Get Unread Notifications
```bash
GET /api/notification?recipientRole=ADMIN&readStatus=false
```

#### 4. Upload Documents to Google Drive
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

files: [file1.pdf, file2.jpg]
deptCode: PROD
docType: QC
shift: A
groupCode: A
category: NG
```

---

## 📊 Complete Workflow Example

### Step 1: Bonding Department Detects NG
```bash
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
```

**Response:**
```json
{
  "success": true,
  "message": "Bonding reject record created and replacement request initiated",
  "data": {
    "bondingReject": {
      "id": "uuid-1",
      "batchNumber": "BND-20250109-A-A-0001",
      "ngQuantity": 100,
      "status": "REPLACEMENT_REQUESTED"
    },
    "replacement": {
      "id": "uuid-2",
      "sourceDept": "BONDING",
      "targetDept": "CUTTING",
      "requestedQty": 100,
      "processedQty": 0,
      "status": "PENDING"
    }
  }
}
```

### Step 2: Cutting Department Checks Pending Replacements
```bash
curl http://localhost:5000/api/replacement?targetDept=CUTTING&status=PENDING
```

### Step 3: Cutting Processes Replacement
```bash
curl -X POST http://localhost:5000/api/cutting/replacement/process \
  -H "Content-Type: application/json" \
  -d '{
    "replacementId": "uuid-2",
    "processedQty": 100,
    "operatorName": "Bob Wilson",
    "machineId": "CUT-01"
  }'
```

**Auto-happens:**
- ✅ Status updated to `COMPLETED`
- ✅ Completion timestamp recorded
- ✅ Notifications sent
- ✅ Replacement progress synced

### Step 4: Check Notifications
```bash
curl http://localhost:5000/api/notification?recipientRole=ADMIN&readStatus=false
```

### Step 5: Upload Evidence Photos
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "files=@evidence1.jpg" \
  -F "files=@evidence2.jpg" \
  -F "deptCode=BONDING" \
  -F "docType=NG" \
  -F "shift=A" \
  -F "groupCode=A" \
  -F "category=NG"
```

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [BONDING_NG_WORKFLOW.md](BONDING_NG_WORKFLOW.md) | Complete workflow explanation |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Full API reference |
| [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md) | Google Drive setup guide |
| [GOOGLE_API_INTEGRATION.md](GOOGLE_API_INTEGRATION.md) | Integration architecture |
| [GOOGLE_SHEETS_INTEGRATION_COMPLETE.md](GOOGLE_SHEETS_INTEGRATION_COMPLETE.md) | Sheets implementation |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Project overview |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick commands |
| [FINAL_SUMMARY.md](FINAL_SUMMARY.md) | Complete summary |

---

## 🏗️ Architecture

### Modules

```
src/modules/
├── bonding-reject/          # Bonding NG management
├── replacement/             # Replacement requests
├── cutting-replacement/     # Cutting processes
└── notification/            # Notification system
```

### Database Tables

1. **bonding_reject** - Bonding NG records
2. **replacement_progress** - Replacement requests
3. **cutting_process** - Cutting operations
4. **notification** - Notifications

### Google Integration

```
Service Account (service-account.json)
    ├── Google Sheets API
    │   └── Auto-log bonding NG
    └── Google Drive API
        └── Upload documents
```

---

## 🧪 Testing

### Test Complete Workflow

```bash
# 1. Create bonding NG
curl -X POST http://localhost:5000/api/bonding/reject/form-input \
  -H "Content-Type: application/json" \
  -d '{"shift":"A","group":"A",...}'

# 2. Check replacement created
curl http://localhost:5000/api/replacement?status=PENDING

# 3. Process replacement
curl -X POST http://localhost:5000/api/cutting/replacement/process \
  -H "Content-Type: application/json" \
  -d '{"replacementId":"uuid","processedQty":100}'

# 4. Check notifications
curl http://localhost:5000/api/notification?readStatus=false

# 5. Verify Google Sheets
# Open spreadsheet and check "NG Log" sheet
```

---

## 📈 Statistics & Reporting

### Available Endpoints

```bash
# Replacement statistics
GET /api/replacement/statistics?startDate=2025-01-01&endDate=2025-01-31

# Cutting statistics
GET /api/cutting/replacement/statistics?startDate=2025-01-01

# Unread notification count
GET /api/notification/unread-count?recipientRole=ADMIN

# Export to Google Sheets
POST /api/bonding/reject/export-to-sheets?shift=A&startDate=2025-01-01
```

---

## 🔐 Security

### Implemented
- ✅ Input validation (class-validator)
- ✅ Whitelist validation
- ✅ Type transformation
- ✅ Global exception filter
- ✅ CORS configuration
- ✅ Comprehensive logging

### Recommended for Production
- 🔲 JWT authentication
- 🔲 Role-based access control
- 🔲 API rate limiting
- 🔲 Request encryption
- 🔲 Audit trail

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Group must be A or B" | Use uppercase "A" or "B" |
| Batch number not unique | Check database for existing records |
| Sheets not logging | Verify service-account.json exists |
| Drive upload fails | Check folder is shared with service account |
| Notifications not sent | Verify NotificationModule imported |

### Debug Mode

```env
DB_LOGGING=true
NODE_ENV=development
```

Check server logs for detailed error messages.

---

## 📦 Deployment

### Production Checklist

- [ ] Set `DB_SYNCHRONIZE=false`
- [ ] Run database migrations
- [ ] Configure PostgreSQL
- [ ] Setup `service-account.json`
- [ ] Update `sheet-config.json`
- [ ] Share Google Sheets
- [ ] Share Google Drive folder
- [ ] Configure CORS
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Test all endpoints

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DB_TYPE=postgres
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=zinus_production
DB_SYNCHRONIZE=false
DB_LOGGING=false

# CORS
ALLOWED_ORIGINS=https://your-frontend.com
```

---

## 🎯 Next Steps

### Recommended Enhancements

1. **Authentication** - JWT + RBAC
2. **Real-time** - WebSocket notifications
3. **Reporting** - Excel/PDF export
4. **Mobile** - Mobile-friendly API
5. **Performance** - Redis caching, queue system

---

## 📞 Support

### Getting Help

1. Check documentation files
2. Review API examples
3. Check server logs
4. Test with provided cURL commands
5. Verify Google API setup

### Reporting Issues

Include:
- Error message
- Request/response
- Server logs
- Environment details

---

## 📄 License

UNLICENSED - Private project

---

## 👥 Contributors

- Backend Development Team
- Zinus Production

---

## 🎉 Status

**Implementation:** ✅ Complete  
**Documentation:** ✅ Complete  
**Testing:** ✅ Ready  
**Production:** ✅ Ready  

**Version:** 1.0.0  
**Last Updated:** January 9, 2025

---

**🚀 Ready for Production Deployment!**

For detailed information, see [FINAL_SUMMARY.md](FINAL_SUMMARY.md)
