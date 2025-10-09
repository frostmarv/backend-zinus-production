# 📋 All Available API Endpoints

## Base URL
```
http://localhost:3000/api
```

---

## 🔴 Bonding Reject Module

### Base Path: `/api/bonding/reject`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/form-input` | Create bonding reject + auto-create replacement |
| **GET** | `/` | Get all bonding rejects (with filters) |
| **GET** | `/:id` | Get bonding reject by ID |
| **GET** | `/batch/:batchNumber` | Get bonding reject by batch number |
| **PUT** | `/:id` | Update bonding reject |
| **PUT** | `/:id/status` | Update bonding reject status |
| **DELETE** | `/:id` | Delete bonding reject |
| **POST** | `/:id/upload-images` | Upload images to Google Drive |
| **POST** | `/export-to-sheets` | Export records to Google Sheets |

#### Query Parameters (GET `/`)
- `shift` - Filter by shift (A/B)
- `group` - Filter by group (A/B)
- `status` - Filter by status
- `startDate` - Filter by start date
- `endDate` - Filter by end date

#### Example: Create Bonding Reject
```bash
POST /api/bonding/reject/form-input
Content-Type: application/json

{
  "shift": "A",
  "group": "A",
  "timeSlot": "07:00-15:00",
  "kashift": "John Doe",
  "admin": "Admin Name",
  "customer": "Customer A",
  "poNumber": "PO-001",
  "customerPo": "CUST-PO-001",
  "sku": "SKU-001",
  "sCode": "S-001",
  "ngQuantity": 50,
  "reason": "Material defect"
}
```

#### Example: Upload Images
```bash
POST /api/bonding/reject/:id/upload-images
Content-Type: multipart/form-data

images: [file1.jpg, file2.jpg, ...]
```

---

## 🟢 Bonding Summary Module

### Base Path: `/api/bonding/summary`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/form-input` | Create bonding summary record |
| **GET** | `/` | Get all bonding summaries (with filters) |
| **GET** | `/:id` | Get bonding summary by ID |
| **GET** | `/batch/:batchNumber` | Get bonding summary by batch number |
| **PUT** | `/:id` | Update bonding summary |
| **DELETE** | `/:id` | Delete bonding summary |
| **POST** | `/export-to-sheets` | Export records to Google Sheets |

#### Query Parameters (GET `/`)
- `shift` - Filter by shift (A/B)
- `group` - Filter by group (A/B)
- `startDate` - Filter by start date
- `endDate` - Filter by end date

---

## 🔵 Replacement Module

### Base Path: `/api/replacement`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/request` | Create replacement request |
| **GET** | `/` | Get all replacement requests |
| **GET** | `/:id` | Get replacement by ID |
| **GET** | `/bonding-reject/:bondingRejectId` | Get replacement by bonding reject ID |
| **PUT** | `/:id/status` | Update replacement status |
| **POST** | `/:id/progress` | Add progress update |
| **GET** | `/:id/progress` | Get progress history |

#### Example: Create Replacement Request
```bash
POST /api/replacement/request
Content-Type: application/json

{
  "sourceDept": "BONDING",
  "targetDept": "CUTTING",
  "sourceBatchNumber": "BND-20240101-A-A-0001",
  "requestedQty": 50,
  "remarks": "Material defect replacement",
  "bondingRejectId": "uuid-here"
}
```

---

## 🟡 Cutting Replacement Module

### Base Path: `/api/cutting/replacement`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/process` | Process replacement from cutting |
| **GET** | `/` | Get all cutting replacements |
| **GET** | `/:id` | Get cutting replacement by ID |
| **GET** | `/replacement/:replacementId` | Get by replacement ID |
| **PUT** | `/:id/complete` | Mark replacement as completed |

#### Example: Process Replacement
```bash
POST /api/cutting/replacement/process
Content-Type: application/json

{
  "replacementId": "uuid-here",
  "processedQty": 30,
  "remarks": "Processed 30 units"
}
```

---

## 🟣 Notification Module

### Base Path: `/api/notification`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/` | Get all notifications |
| **GET** | `/unread` | Get unread notifications |
| **GET** | `/role/:role` | Get notifications by role |
| **PUT** | `/:id/read` | Mark notification as read |
| **PUT** | `/read-all` | Mark all as read |
| **DELETE** | `/:id` | Delete notification |

#### Roles
- `BONDING_ADMIN`
- `BONDING_KASHIFT`
- `CUTTING_ADMIN`
- `CUTTING_KASHIFT`
- `SUPER_ADMIN`

---

## 📊 Workable Bonding Module

### Base Path: `/api/workable-bonding`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/` | Get workable bonding summary (with NG tracking) |
| **GET** | `/detail` | Get detailed workable bonding (with NG tracking) |

#### Query Parameters
- `week` - Filter by week
- `shipToName` - Filter by customer
- `sku` - Filter by SKU
- `status` - Filter by status

#### Response Fields (NEW!)
```json
{
  "week": "2024-W01",
  "shipToName": "Customer A",
  "sku": "SKU-001",
  "quantityOrder": 1000,
  "workable": 800,
  "bonding": 500,
  "ng": 50,              // ← NEW: Total NG
  "replacement": 30,     // ← NEW: Replacement processed
  "ng_active": 20,       // ← NEW: Active NG (ng - replacement)
  "remain": 280,         // ← UPDATED: workable - bonding - ng_active
  "remarks": "",
  "status": "IN_PROGRESS"
}
```

---

## 🏭 Production Modules

### Cutting Module: `/api/cutting`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/entries` | Create cutting entry |
| **GET** | `/entries` | Get all cutting entries |
| **GET** | `/entries/:id` | Get cutting entry by ID |
| **PUT** | `/entries/:id` | Update cutting entry |
| **DELETE** | `/entries/:id` | Delete cutting entry |

### Assembly Layers: `/api/assembly-layers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/` | Create assembly layer |
| **GET** | `/` | Get all assembly layers |
| **GET** | `/:id` | Get assembly layer by ID |
| **PUT** | `/:id` | Update assembly layer |
| **DELETE** | `/:id` | Delete assembly layer |

### Packing Foam: `/api/packing-foam`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/` | Create packing foam record |
| **GET** | `/` | Get all packing foam records |
| **GET** | `/:id` | Get packing foam by ID |
| **PUT** | `/:id` | Update packing foam |
| **DELETE** | `/:id` | Delete packing foam |

---

## 📦 Production Order Modules

### Production Orders: `/api/production-orders`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/` | Create production order |
| **GET** | `/` | Get all production orders |
| **GET** | `/:id` | Get production order by ID |
| **PUT** | `/:id` | Update production order |
| **DELETE** | `/:id` | Delete production order |

### Production Order Items: `/api/production-order-items`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/` | Create production order item |
| **GET** | `/` | Get all production order items |
| **GET** | `/:id` | Get production order item by ID |
| **PUT** | `/:id` | Update production order item |
| **DELETE** | `/:id` | Delete production order item |

### Production Planning: `/api/production-planning`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/` | Create production plan |
| **GET** | `/` | Get all production plans |
| **GET** | `/:id` | Get production plan by ID |
| **PUT** | `/:id` | Update production plan |
| **DELETE** | `/:id` | Delete production plan |

---

## 📚 Master Data Modules

### Customers: `/api/customers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/` | Create customer |
| **GET** | `/` | Get all customers |
| **GET** | `/:id` | Get customer by ID |
| **PUT** | `/:id` | Update customer |
| **DELETE** | `/:id` | Delete customer |

### Products: `/api/products`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/` | Create product |
| **GET** | `/` | Get all products |
| **GET** | `/:id` | Get product by ID |
| **PUT** | `/:id` | Update product |
| **DELETE** | `/:id` | Delete product |

### Master Data: `/api/master-data`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/shifts` | Get all shifts |
| **GET** | `/groups` | Get all groups |
| **GET** | `/time-slots` | Get all time slots |
| **GET** | `/machines` | Get all machines |
| **GET** | `/reasons` | Get all reject reasons |

---

## 🔄 Workflow Integration

### Complete NG → Replacement Flow

```
1. POST /api/bonding/reject/form-input
   ↓ Auto-creates replacement request
   ↓ Sends notifications
   ↓ Logs to Google Sheets
   
2. GET /api/replacement/:id
   ↓ Check replacement status
   
3. POST /api/cutting/replacement/process
   ↓ Process replacement from cutting
   ↓ Updates replacement progress
   ↓ Sends notifications
   
4. GET /api/workable-bonding
   ↓ View updated workable with NG tracking
   ↓ ng_active reduces as replacement processed
   ↓ remain increases as replacement completed
```

---

## 📤 Google Integration Endpoints

### Google Sheets Export

| Module | Endpoint | Description |
|--------|----------|-------------|
| Bonding Reject | `POST /api/bonding/reject/export-to-sheets` | Export to "NG Log" sheet |
| Bonding Summary | `POST /api/bonding/summary/export-to-sheets` | Export to "Bonding Summary" sheet |

### Google Drive Upload

| Module | Endpoint | Description |
|--------|----------|-------------|
| Bonding Reject | `POST /api/bonding/reject/:id/upload-images` | Upload images to Drive |

**Auto Folder Structure:**
```
ZinusDreamIndonesia/
└── Bonding-Reject/
    └── YYYY/
        └── MM/
            └── BATCH-NUMBER/
                ├── image1.jpg
                ├── image2.jpg
                └── ...
```

---

## 🎯 Key Features

### ✅ Bonding NG Workflow
- Auto-create replacement request
- Multi-role notifications
- Google Sheets auto-logging
- Image upload to Google Drive
- Status tracking

### ✅ Workable Bonding with NG Tracking
- Real-time NG calculation
- Replacement progress tracking
- Active NG monitoring
- Accurate remain calculation

### ✅ Google Integration
- Auto-upload images to Drive
- Auto-log to Sheets
- Organized folder structure
- Non-blocking operations

---

## 📝 Notes

1. **Batch Number Format**: `BND-YYYYMMDD-SHIFT-GROUP-XXXX`
2. **Shift Values**: `A` or `B` only
3. **Group Values**: `A` or `B` only
4. **Image Upload**: Max 10 images, JPEG/PNG/GIF only
5. **NG Tracking**: Automatic in workable bonding views
6. **Replacement**: Auto-created on bonding reject

---

## 🧪 Testing

### Test Bonding Reject Flow
```bash
# 1. Create bonding reject
curl -X POST http://localhost:3000/api/bonding/reject/form-input \
  -H "Content-Type: application/json" \
  -d '{
    "shift": "A",
    "group": "A",
    "timeSlot": "07:00-15:00",
    "kashift": "John",
    "admin": "Admin",
    "customer": "Customer A",
    "poNumber": "PO-001",
    "customerPo": "CUST-001",
    "sku": "SKU-001",
    "sCode": "S-001",
    "ngQuantity": 50,
    "reason": "Defect"
  }'

# 2. Check workable bonding
curl http://localhost:3000/api/workable-bonding?sku=SKU-001

# 3. Process replacement
curl -X POST http://localhost:3000/api/cutting/replacement/process \
  -H "Content-Type: application/json" \
  -d '{
    "replacementId": "uuid-from-step-1",
    "processedQty": 30,
    "remarks": "Processed"
  }'

# 4. Check workable bonding again
curl http://localhost:3000/api/workable-bonding?sku=SKU-001
# ng_active should reduce from 50 to 20
# remain should increase by 30
```

---

**Total Modules:** 15  
**Total Endpoints:** 80+  
**Status:** ✅ All Operational
