# 🔧 Cutting Replacement - API Endpoints

## Base URL
```
http://localhost:3000/api
```

---

## 📋 1. Lihat History Replacement yang Perlu Diproses

### Endpoint: `GET /api/replacement`

**Query Parameters:**
- `targetDept=CUTTING` - Filter untuk cutting department
- `status` - Filter by status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `sourceDept` - Filter by source department (BONDING, ASSEMBLY)
- `sourceBatchNumber` - Filter by batch number

### Example Requests:

#### 1.1 Lihat Semua Replacement untuk Cutting
```bash
GET /api/replacement?targetDept=CUTTING
```

#### 1.2 Lihat Replacement yang Pending (Belum Diproses)
```bash
GET /api/replacement?targetDept=CUTTING&status=PENDING
```

#### 1.3 Lihat Replacement yang Sedang Diproses
```bash
GET /api/replacement?targetDept=CUTTING&status=IN_PROGRESS
```

#### 1.4 Lihat Replacement dari Bonding Tertentu
```bash
GET /api/replacement?targetDept=CUTTING&sourceBatchNumber=BND-20240109-A-A-0001
```

### Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid-replacement-1",
      "sourceDept": "BONDING",
      "targetDept": "CUTTING",
      "sourceBatchNumber": "BND-20240109-A-A-0001",
      "requestedQty": 50,
      "processedQty": 0,
      "status": "PENDING",
      "remarks": "Auto-generated from bonding NG: Material defect",
      "bondingRejectId": "uuid-bonding-reject",
      "createdAt": "2024-01-09T08:30:00.000Z",
      "updatedAt": "2024-01-09T08:30:00.000Z"
    },
    {
      "id": "uuid-replacement-2",
      "sourceDept": "BONDING",
      "targetDept": "CUTTING",
      "sourceBatchNumber": "BND-20240109-A-A-0002",
      "requestedQty": 30,
      "processedQty": 15,
      "status": "IN_PROGRESS",
      "remarks": "Partial replacement processed",
      "bondingRejectId": "uuid-bonding-reject-2",
      "createdAt": "2024-01-09T09:00:00.000Z",
      "updatedAt": "2024-01-09T10:15:00.000Z"
    }
  ]
}
```

---

## 🚀 2. Proses Replacement (Kirim Hasil Cutting)

### Endpoint: `POST /api/cutting/replacement/process`

**Request Body:**
```json
{
  "replacementId": "uuid-replacement",
  "processedQty": 30,
  "operatorName": "John Doe",
  "machineId": "MC-001"
}
```

**Field Descriptions:**
- `replacementId` (required) - UUID dari replacement request
- `processedQty` (required) - Jumlah yang sudah diproses
- `operatorName` (optional) - Nama operator cutting
- `machineId` (optional) - ID mesin cutting

### Example Request:

#### 2.1 Proses Replacement Pertama Kali
```bash
POST /api/cutting/replacement/process
Content-Type: application/json

{
  "replacementId": "uuid-replacement-1",
  "processedQty": 30,
  "operatorName": "John Doe",
  "machineId": "MC-001"
}
```

#### 2.2 Proses Replacement Lanjutan (Partial)
```bash
POST /api/cutting/replacement/process
Content-Type: application/json

{
  "replacementId": "uuid-replacement-1",
  "processedQty": 20,
  "operatorName": "Jane Smith",
  "machineId": "MC-002"
}
```

### Response:
```json
{
  "success": true,
  "message": "Replacement processed successfully",
  "data": {
    "id": "uuid-cutting-process",
    "replacementId": "uuid-replacement-1",
    "processedQty": 30,
    "operatorName": "John Doe",
    "machineId": "MC-001",
    "status": "COMPLETED",
    "createdAt": "2024-01-09T10:30:00.000Z",
    "updatedAt": "2024-01-09T10:30:00.000Z",
    "replacement": {
      "id": "uuid-replacement-1",
      "sourceBatchNumber": "BND-20240109-A-A-0001",
      "requestedQty": 50,
      "processedQty": 30,
      "status": "IN_PROGRESS"
    }
  }
}
```

---

## 📊 3. Lihat Detail Replacement Tertentu

### Endpoint: `GET /api/replacement/:id`

### Example Request:
```bash
GET /api/replacement/uuid-replacement-1
```

### Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-replacement-1",
    "sourceDept": "BONDING",
    "targetDept": "CUTTING",
    "sourceBatchNumber": "BND-20240109-A-A-0001",
    "requestedQty": 50,
    "processedQty": 30,
    "status": "IN_PROGRESS",
    "remarks": "Auto-generated from bonding NG: Material defect",
    "bondingRejectId": "uuid-bonding-reject",
    "createdAt": "2024-01-09T08:30:00.000Z",
    "updatedAt": "2024-01-09T10:30:00.000Z",
    "bondingReject": {
      "id": "uuid-bonding-reject",
      "batchNumber": "BND-20240109-A-A-0001",
      "ngQuantity": 50,
      "reason": "Material defect",
      "customer": "Customer A",
      "sku": "SKU-001"
    }
  }
}
```

---

## 📈 4. Lihat Statistik Replacement

### Endpoint: `GET /api/replacement/statistics`

**Query Parameters:**
- `targetDept=CUTTING` - Filter untuk cutting
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)

### Example Request:
```bash
GET /api/replacement/statistics?targetDept=CUTTING&startDate=2024-01-01&endDate=2024-01-31
```

### Response:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "pending": 5,
    "inProgress": 8,
    "completed": 10,
    "cancelled": 2,
    "totalRequested": 1250,
    "totalProcessed": 980,
    "completionRate": 78.4
  }
}
```

---

## 🔍 5. Lihat History Cutting Process

### Endpoint: `GET /api/cutting/replacement`

**Query Parameters:**
- `replacementId` - Filter by replacement ID
- `status` - Filter by status (PENDING, IN_PROGRESS, COMPLETED)

### Example Request:

#### 5.1 Lihat Semua Cutting Process
```bash
GET /api/cutting/replacement
```

#### 5.2 Lihat Cutting Process untuk Replacement Tertentu
```bash
GET /api/cutting/replacement?replacementId=uuid-replacement-1
```

### Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid-cutting-process-1",
      "replacementId": "uuid-replacement-1",
      "processedQty": 30,
      "operatorName": "John Doe",
      "machineId": "MC-001",
      "status": "COMPLETED",
      "createdAt": "2024-01-09T10:30:00.000Z",
      "updatedAt": "2024-01-09T10:30:00.000Z"
    },
    {
      "id": "uuid-cutting-process-2",
      "replacementId": "uuid-replacement-1",
      "processedQty": 20,
      "operatorName": "Jane Smith",
      "machineId": "MC-002",
      "status": "COMPLETED",
      "createdAt": "2024-01-09T11:00:00.000Z",
      "updatedAt": "2024-01-09T11:00:00.000Z"
    }
  ]
}
```

---

## 📈 6. Lihat Statistik Cutting Replacement

### Endpoint: `GET /api/cutting/replacement/statistics`

**Query Parameters:**
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)

### Example Request:
```bash
GET /api/cutting/replacement/statistics?startDate=2024-01-01&endDate=2024-01-31
```

### Response:
```json
{
  "success": true,
  "data": {
    "totalProcesses": 45,
    "totalProcessed": 980,
    "averagePerProcess": 21.8,
    "byStatus": {
      "PENDING": 5,
      "IN_PROGRESS": 8,
      "COMPLETED": 32
    }
  }
}
```

---

## 🔄 Complete Workflow Example

### Scenario: Bonding NG → Cutting Process Replacement

#### Step 1: Bonding Create NG
```bash
POST /api/bonding/reject/form-input
{
  "shift": "A",
  "group": "A",
  "ngQuantity": 50,
  "reason": "Material defect",
  ...
}
```
**Result:** Auto-creates replacement request with status PENDING

---

#### Step 2: Cutting Lihat Replacement yang Perlu Diproses
```bash
GET /api/replacement?targetDept=CUTTING&status=PENDING
```
**Response:**
```json
{
  "data": [
    {
      "id": "uuid-replacement-1",
      "sourceBatchNumber": "BND-20240109-A-A-0001",
      "requestedQty": 50,
      "processedQty": 0,
      "status": "PENDING"
    }
  ]
}
```

---

#### Step 3: Cutting Proses Replacement (Partial)
```bash
POST /api/cutting/replacement/process
{
  "replacementId": "uuid-replacement-1",
  "processedQty": 30,
  "operatorName": "John Doe"
}
```
**Result:** 
- Replacement status → IN_PROGRESS
- processedQty → 30
- Notification sent to bonding

---

#### Step 4: Cutting Proses Sisa Replacement
```bash
POST /api/cutting/replacement/process
{
  "replacementId": "uuid-replacement-1",
  "processedQty": 20,
  "operatorName": "Jane Smith"
}
```
**Result:**
- Replacement status → COMPLETED
- processedQty → 50 (30 + 20)
- Notification sent to bonding
- Workable bonding updated (ng_active reduced)

---

#### Step 5: Verify di Workable Bonding
```bash
GET /api/workable-bonding?sku=SKU-001
```
**Response:**
```json
{
  "data": [
    {
      "sku": "SKU-001",
      "workable": 800,
      "bonding": 500,
      "ng": 50,
      "replacement": 50,
      "ng_active": 0,
      "remain": 300
    }
  ]
}
```

---

## 🎯 Status Flow

```
PENDING → IN_PROGRESS → COMPLETED
   ↓
CANCELLED (if needed)
```

**Status Descriptions:**
- **PENDING** - Replacement request baru, belum diproses
- **IN_PROGRESS** - Sedang diproses, processedQty < requestedQty
- **COMPLETED** - Selesai diproses, processedQty >= requestedQty
- **CANCELLED** - Dibatalkan

---

## 📝 Notes

1. **Auto Status Update:**
   - Status otomatis berubah ke IN_PROGRESS saat pertama kali proses
   - Status otomatis berubah ke COMPLETED saat processedQty >= requestedQty

2. **Partial Processing:**
   - Bisa proses replacement secara bertahap
   - Setiap proses akan menambah processedQty
   - History semua proses tersimpan di cutting_replacement table

3. **Notifications:**
   - Bonding admin & kashift dapat notifikasi saat replacement diproses
   - Bonding admin & kashift dapat notifikasi saat replacement completed

4. **Workable Bonding Integration:**
   - ng_active otomatis berkurang saat replacement diproses
   - remain otomatis bertambah saat replacement diproses

---

## 🧪 Testing dengan cURL

### Test 1: Lihat Pending Replacements
```bash
curl -X GET "http://localhost:3000/api/replacement?targetDept=CUTTING&status=PENDING"
```

### Test 2: Proses Replacement
```bash
curl -X POST http://localhost:3000/api/cutting/replacement/process \
  -H "Content-Type: application/json" \
  -d '{
    "replacementId": "uuid-here",
    "processedQty": 30,
    "operatorName": "John Doe",
    "machineId": "MC-001"
  }'
```

### Test 3: Lihat History Cutting Process
```bash
curl -X GET "http://localhost:3000/api/cutting/replacement?replacementId=uuid-here"
```

---

## 🔗 Related Endpoints

- **Bonding Reject:** `/api/bonding/reject`
- **Notifications:** `/api/notification`
- **Workable Bonding:** `/api/workable-bonding`

---

**Status:** ✅ Ready to Use  
**Last Updated:** 2024-01-09
