# Quick Reference - Bonding NG Workflow API

## 🚀 Quick Start

```bash
# Install dependencies
npm install multer @types/multer uuid dayjs

# Start development server
npm run start:dev

# Server runs on: http://localhost:5000
# API base: http://localhost:5000/api
```

---

## 📋 Most Used Endpoints

### 1. Create Bonding NG (Auto-creates Replacement)
```bash
POST /api/bonding/reject/form-input
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

### 2. List Pending Replacements
```bash
GET /api/replacement?targetDept=CUTTING&status=PENDING
```

### 3. Process Replacement (Cutting)
```bash
POST /api/cutting/replacement/process
{
  "replacementId": "uuid",
  "processedQty": 50,
  "operatorName": "Bob Wilson",
  "machineId": "CUT-01"
}
```

### 4. Get Unread Notifications
```bash
GET /api/notification?recipientRole=ADMIN&readStatus=false
```

### 5. Mark Notification as Read
```bash
PUT /api/notification/{id}/read
```

---

## 🔢 Batch Number Format

**Format:** `BND-YYYYMMDD-SHIFT-GROUP-XXXX`

**Examples:**
- `BND-20250109-A-A-0001` (First batch, Shift A, Group A)
- `BND-20250109-A-B-0001` (First batch, Shift A, Group B)
- `BND-20250109-B-A-0001` (First batch, Shift B, Group A)

---

## 📊 Status Flow

### Bonding Reject
```
PENDING → REPLACEMENT_REQUESTED → IN_PROGRESS → COMPLETED
```

### Replacement
```
PENDING → IN_PROGRESS → COMPLETED
         ↓
      CANCELLED
```

### Cutting Process
```
PENDING → IN_PROGRESS → COMPLETED
         ↓
      FAILED
```

---

## 🎯 Key Validations

| Field | Rule |
|-------|------|
| shift | Must be "A" or "B" |
| group | Must be "A" or "B" |
| ngQuantity | Must be >= 1 |
| processedQty | Cannot exceed requestedQty |

---

## 📱 Notification Roles

- `ADMIN` - System administrators
- `LEADER` - Team leaders
- `OPERATOR` - Machine operators
- `SUPERVISOR` - Department supervisors
- `ALL` - Everyone

---

## 🔔 Auto-Notifications

| Event | Recipients | Type |
|-------|-----------|------|
| Bonding NG Created | ADMIN, LEADER | WARNING |
| Replacement Created | ADMIN, SUPERVISOR | INFO |
| Replacement Completed | ADMIN, LEADER | SUCCESS |
| Cutting Process Updated | ADMIN, SUPERVISOR | INFO |

---

## 📈 Statistics Endpoints

```bash
# Replacement statistics
GET /api/replacement/statistics?startDate=2025-01-01&endDate=2025-01-31

# Cutting statistics
GET /api/cutting/replacement/statistics?startDate=2025-01-01

# Unread notification count
GET /api/notification/unread-count?recipientRole=ADMIN
```

---

## 🗂️ Module Locations

```
src/modules/
├── bonding-reject/          # Bonding NG management
├── replacement/             # Replacement requests
├── cutting-replacement/     # Cutting processes
└── notification/            # Notifications
```

---

## 🔍 Common Queries

### Get Today's Bonding Rejects
```bash
GET /api/bonding/reject?startDate=2025-01-09&shift=A
```

### Get In-Progress Replacements
```bash
GET /api/replacement?status=IN_PROGRESS
```

### Get Completed Cutting Processes
```bash
GET /api/cutting/replacement?status=COMPLETED
```

### Get All Unread Notifications
```bash
GET /api/notification?readStatus=false
```

---

## ⚡ Quick Commands

### cURL Examples

**Create Bonding NG:**
```bash
curl -X POST http://localhost:5000/api/bonding/reject/form-input \
  -H "Content-Type: application/json" \
  -d '{"shift":"A","group":"A","timeSlot":"08:00-16:00","machine":"BND-01","kashift":"John","admin":"Jane","customer":"ACME","poNumber":"PO-001","customerPo":"CP-001","sku":"SKU-001","sCode":"S-001","ngQuantity":100,"reason":"Test"}'
```

**Process Replacement:**
```bash
curl -X POST http://localhost:5000/api/cutting/replacement/process \
  -H "Content-Type: application/json" \
  -d '{"replacementId":"uuid","processedQty":50,"operatorName":"Bob","machineId":"CUT-01"}'
```

**Mark All Notifications Read:**
```bash
curl -X PUT http://localhost:5000/api/notification/read/all?recipientRole=ADMIN
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Group must be A or B" | Use uppercase "A" or "B" only |
| "Processed qty exceeds requested" | Check replacement requestedQty first |
| "Not found" error | Verify UUID is correct |
| No notifications | Check NotificationModule imported |
| Batch number not unique | Check database for existing records |

---

## 📝 Response Format

**Success:**
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "...",
  "error": "Bad Request"
}
```

---

## 🔗 Related Files

- `BONDING_NG_WORKFLOW.md` - Complete workflow guide
- `API_DOCUMENTATION.md` - Full API reference
- `GOOGLE_DRIVE_SETUP.md` - Google Drive setup
- `IMPLEMENTATION_SUMMARY.md` - Project overview

---

## 💡 Pro Tips

1. **Always check replacement status** before processing in cutting
2. **Use statistics endpoints** for dashboard data
3. **Mark notifications as read** to keep count accurate
4. **Filter by date range** for better performance
5. **Use batch number** for quick lookups

---

## 🎯 Common Workflows

### Daily Operations

1. **Morning:**
   - Check pending replacements
   - Review unread notifications
   - Check yesterday's statistics

2. **During Shift:**
   - Create bonding NG records as needed
   - Process replacements in cutting
   - Monitor notification count

3. **End of Shift:**
   - Review completed processes
   - Mark all notifications as read
   - Generate shift report

### Weekly Review

```bash
# Get week statistics
GET /api/replacement/statistics?startDate=2025-01-01&endDate=2025-01-07

# Get cutting performance
GET /api/cutting/replacement/statistics?startDate=2025-01-01&endDate=2025-01-07
```

---

## 🚨 Emergency Commands

### Cancel Replacement
```bash
PUT /api/replacement/{id}/status
{"status": "CANCELLED"}
```

### Mark Cutting as Failed
```bash
PUT /api/cutting/replacement/{id}/status
{"status": "FAILED"}
```

### Delete Bonding Record
```bash
DELETE /api/bonding/reject/{id}
```

---

## 📞 Need Help?

1. Check error message in response
2. Review API_DOCUMENTATION.md
3. Check server logs
4. Verify request body format
5. Test with provided cURL examples

---

**Last Updated:** January 9, 2025  
**Version:** 1.0.0
