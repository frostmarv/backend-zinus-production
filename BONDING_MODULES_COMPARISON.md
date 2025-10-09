# Bonding Modules Comparison

## 📊 Overview

Ada **2 module bonding** yang berbeda dengan fungsi berbeda:

### 1. Bonding Summary Module (Existing) ✅
**Path:** `src/modules/bonding/`  
**Endpoint:** `/api/bonding/summary/form-input`  
**Purpose:** Track **production data** (bonding summary)

### 2. Bonding Reject Module (New) ✅
**Path:** `src/modules/bonding-reject/`  
**Endpoint:** `/api/bonding/reject/form-input`  
**Purpose:** Track **NG/reject data** dengan replacement workflow

---

## 🔍 Detailed Comparison

| Feature | Bonding Summary | Bonding Reject |
|---------|----------------|----------------|
| **Endpoint** | `/api/bonding/summary/form-input` | `/api/bonding/reject/form-input` |
| **Purpose** | Production tracking | NG/reject tracking |
| **Google Sheets** | ✅ Auto-log to "Bonding Summary" | ✅ Auto-log to "NG Log" |
| **Batch Number** | ❌ No | ✅ Yes (BND-YYYYMMDD-SHIFT-GROUP-XXXX) |
| **Replacement** | ❌ No | ✅ Auto-create replacement request |
| **Notifications** | ❌ No | ✅ Auto-send to ADMIN/LEADER |
| **Group Validation** | ❌ No specific validation | ✅ Only A or B allowed |
| **Workflow** | Simple save | Complex (NG → Replacement → Cutting) |

---

## 📝 Bonding Summary Module (Existing)

### Endpoint
```
POST /api/bonding/summary/form-input
```

### Request Body
```json
{
  "timestamp": "2025-01-09T10:00:00Z",
  "shift": "A",
  "group": "A",
  "time_slot": "08:00-16:00",
  "machine": "BND-01",
  "kashift": "John Doe",
  "admin": "Jane Smith",
  "customer": "ACME Corp",
  "po_number": "PO-2025-001",
  "customer_po": "CUST-PO-123",
  "sku": "SKU-12345",
  "week": "W01",
  "quantity_produksi": 1000
}
```

### What Happens
1. ✅ Save to database (`bonding_summary` table)
2. ✅ Auto-log to Google Sheets ("Bonding Summary" sheet)
3. ✅ Return success response

### Google Sheets Format
**Sheet:** "Bonding Summary"

| Timestamp | Shift | Group | Time Slot | Machine | Kashift | Admin | Customer | PO Number | Customer PO | SKU | Week | Quantity Produksi |
|-----------|-------|-------|-----------|---------|---------|-------|----------|-----------|-------------|-----|------|-------------------|
| 2025-01-09T10:00:00Z | A | A | 08:00-16:00 | BND-01 | John Doe | Jane Smith | ACME Corp | PO-2025-001 | CUST-PO-123 | SKU-12345 | W01 | 1000 |

### Use Case
- **Daily production tracking**
- **Quantity monitoring**
- **Performance reporting**
- **Production summary**

---

## 🚨 Bonding Reject Module (New)

### Endpoint
```
POST /api/bonding/reject/form-input
```

### Request Body
```json
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

### What Happens
1. ✅ **Auto-generate batch number:** `BND-20250109-A-A-0001`
2. ✅ Save to database (`bonding_reject` table)
3. ✅ **Auto-create replacement request** (BONDING → CUTTING)
4. ✅ Update status to `REPLACEMENT_REQUESTED`
5. ✅ **Send notifications** to ADMIN & LEADER
6. ✅ **Auto-log to Google Sheets** ("NG Log" sheet)

### Google Sheets Format
**Sheet:** "NG Log"

| Batch Number | Timestamp | Shift | Group | Time Slot | Machine | Kashift | Admin | Customer | PO Number | Customer PO | SKU | S Code | NG Quantity | Reason | Status |
|--------------|-----------|-------|-------|-----------|---------|---------|-------|----------|-----------|-------------|-----|--------|-------------|--------|--------|
| BND-20250109-A-A-0001 | 2025-01-09T10:00:00Z | A | A | 08:00-16:00 | BND-01 | John Doe | Jane Smith | ACME Corp | PO-2025-001 | CUST-PO-123 | SKU-12345 | S-001 | 100 | Adhesive defect | REPLACEMENT_REQUESTED |

### Use Case
- **NG/reject tracking**
- **Replacement workflow**
- **Quality control**
- **Defect analysis**

---

## 🔄 Workflow Comparison

### Bonding Summary Workflow
```
POST /api/bonding/summary/form-input
    ↓
Save to Database
    ↓
Log to Google Sheets ("Bonding Summary")
    ↓
Done ✅
```

### Bonding Reject Workflow
```
POST /api/bonding/reject/form-input
    ↓
Generate Batch Number (BND-20250109-A-A-0001)
    ↓
Save to Database
    ↓
Create Replacement Request (BONDING → CUTTING)
    ↓
Update Status (REPLACEMENT_REQUESTED)
    ↓
Send Notifications (ADMIN, LEADER)
    ↓
Log to Google Sheets ("NG Log")
    ↓
Done ✅
    ↓
[Later] Cutting Department Processes
    ↓
POST /api/cutting/replacement/process
    ↓
Update Progress & Status
    ↓
Send Completion Notification
    ↓
Done ✅
```

---

## 📊 Google Sheets Configuration

### Current Configuration
**File:** `src/config/sheet-config.json`

```json
{
  "departments": {
    "bonding": {
      "summary": {
        "sheetName": "Bonding Summary",
        "spreadsheetId": "1XcfiI5CgS8PmuprcM4u6zV-_PRsN09W9X_-v0nuZKC0"
      },
      "ng_log": {
        "sheetName": "NG Log",
        "spreadsheetId": "1XcfiI5CgS8PmuprcM4u6zV-_PRsN09W9X_-v0nuZKC0"
      }
    }
  }
}
```

### Sheets in Spreadsheet

1. **"Bonding Summary"** - Production data from `/api/bonding/summary/form-input`
2. **"NG Log"** - Reject data from `/api/bonding/reject/form-input`

---

## 🎯 When to Use Which?

### Use Bonding Summary (`/api/bonding/summary/form-input`)
✅ Recording **normal production** data  
✅ Daily production tracking  
✅ Quantity monitoring  
✅ Performance reporting  
✅ Production summary  

**Example:**
- "Today we produced 1000 units on machine BND-01"
- "Shift A completed 500 units"

### Use Bonding Reject (`/api/bonding/reject/form-input`)
✅ Recording **NG/defect** data  
✅ Quality issues  
✅ Need replacement from cutting  
✅ Defect tracking  
✅ Root cause analysis  

**Example:**
- "Found 100 units with adhesive defect"
- "Need replacement from cutting department"
- "Quality issue on machine BND-01"

---

## 🔗 Integration Points

### Both Modules
- ✅ Auto-log to Google Sheets
- ✅ Save to database
- ✅ Non-blocking error handling

### Only Bonding Reject
- ✅ Auto-generate batch number
- ✅ Create replacement request
- ✅ Send notifications
- ✅ Track workflow status
- ✅ Integration with cutting department

---

## 📝 API Examples

### Example 1: Normal Production (Use Bonding Summary)
```bash
# Record normal production
curl -X POST http://localhost:5000/api/bonding/summary/form-input \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-01-09T10:00:00Z",
    "shift": "A",
    "group": "A",
    "time_slot": "08:00-16:00",
    "machine": "BND-01",
    "kashift": "John Doe",
    "admin": "Jane Smith",
    "customer": "ACME Corp",
    "po_number": "PO-2025-001",
    "customer_po": "CUST-PO-123",
    "sku": "SKU-12345",
    "week": "W01",
    "quantity_produksi": 1000
  }'
```

### Example 2: NG/Defect Found (Use Bonding Reject)
```bash
# Record NG/defect with replacement workflow
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

---

## 🔍 Database Tables

### bonding_summary (Existing)
```sql
CREATE TABLE bonding_summary (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP,
  shift VARCHAR,
  group VARCHAR,
  time_slot VARCHAR,
  machine VARCHAR,
  kashift VARCHAR,
  admin VARCHAR,
  customer VARCHAR,
  po_number VARCHAR,
  customer_po VARCHAR,
  sku VARCHAR,
  week VARCHAR,
  quantity_produksi INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### bonding_reject (New)
```sql
CREATE TABLE bonding_reject (
  id UUID PRIMARY KEY,
  batch_number VARCHAR UNIQUE,
  timestamp TIMESTAMP,
  shift ENUM('A', 'B'),
  group ENUM('A', 'B'),
  time_slot VARCHAR,
  machine VARCHAR,
  kashift VARCHAR,
  admin VARCHAR,
  customer VARCHAR,
  po_number VARCHAR,
  customer_po VARCHAR,
  sku VARCHAR,
  s_code VARCHAR,
  ng_quantity INTEGER,
  reason TEXT,
  status ENUM,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## ✅ Summary

### Bonding Summary
- **Purpose:** Production tracking
- **Endpoint:** `/api/bonding/summary/form-input`
- **Sheet:** "Bonding Summary"
- **Workflow:** Simple (save + log)
- **Status:** ✅ Already working

### Bonding Reject
- **Purpose:** NG/reject tracking with replacement workflow
- **Endpoint:** `/api/bonding/reject/form-input`
- **Sheet:** "NG Log"
- **Workflow:** Complex (NG → Replacement → Cutting)
- **Status:** ✅ Newly implemented

### Both Auto-Log to Google Sheets ✅

**Answer to your question:**
> "Apakah /api/bonding/summary/form-input otomatis masuk ke Google Sheets?"

**YES! ✅** Sudah otomatis masuk ke Google Sheets sheet "Bonding Summary" sejak awal.

**Dan sekarang:**
- `/api/bonding/summary/form-input` → Google Sheets "Bonding Summary" ✅
- `/api/bonding/reject/form-input` → Google Sheets "NG Log" ✅

**Keduanya sudah terintegrasi dengan Google Sheets!** 🎉

---

**Last Updated:** January 9, 2025  
**Version:** 1.0.0
