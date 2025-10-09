# API Documentation - Bonding NG Workflow System

## Base URL
```
http://localhost:5000/api
```

## Response Format

All endpoints return a consistent response format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "count": 10  // For list endpoints
}
```

**Error Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2025-01-09T10:00:00.000Z",
  "path": "/api/bonding/reject",
  "method": "POST",
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## 1. Bonding Reject API

### 1.1 Create Bonding NG Record (with Auto-Replacement)

**Endpoint:** `POST /api/bonding/reject/form-input`

**Description:** Creates a bonding NG record, automatically generates batch number, creates replacement request, and sends notifications.

**Request Body:**
```json
{
  "shift": "A",              // Required: "A" or "B"
  "group": "A",              // Required: "A" or "B"
  "timeSlot": "08:00-16:00", // Required
  "machine": "BND-01",       // Required
  "kashift": "John Doe",     // Required: Operator name
  "admin": "Jane Smith",     // Required: Admin name
  "customer": "ACME Corp",   // Required
  "poNumber": "PO-2025-001", // Required
  "customerPo": "CUST-PO-123", // Required
  "sku": "SKU-12345",        // Required
  "sCode": "S-001",          // Required
  "ngQuantity": 100,         // Required: >= 1
  "reason": "Adhesive defect" // Required
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bonding reject record created and replacement request initiated",
  "data": {
    "bondingReject": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "batchNumber": "BND-20250109-A-A-0001",
      "timestamp": "2025-01-09T10:00:00.000Z",
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
      "reason": "Adhesive defect",
      "status": "REPLACEMENT_REQUESTED",
      "createdAt": "2025-01-09T10:00:00.000Z",
      "updatedAt": "2025-01-09T10:00:00.000Z"
    },
    "replacement": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "sourceDept": "BONDING",
      "targetDept": "CUTTING",
      "sourceBatchNumber": "BND-20250109-A-A-0001",
      "requestedQty": 100,
      "processedQty": 0,
      "status": "PENDING",
      "remarks": "Auto-generated from bonding NG: Adhesive defect",
      "bondingRejectId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-01-09T10:00:00.000Z",
      "updatedAt": "2025-01-09T10:00:00.000Z"
    }
  }
}
```

### 1.2 List Bonding Reject Records

**Endpoint:** `GET /api/bonding/reject`

**Query Parameters:**
- `shift` (optional): Filter by shift (A or B)
- `group` (optional): Filter by group (A or B)
- `status` (optional): Filter by status (PENDING, REPLACEMENT_REQUESTED, IN_PROGRESS, COMPLETED, CANCELLED)
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter to date (ISO 8601)

**Example:**
```
GET /api/bonding/reject?shift=A&status=REPLACEMENT_REQUESTED&startDate=2025-01-01
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "batchNumber": "BND-20250109-A-A-0001",
      "ngQuantity": 100,
      "status": "REPLACEMENT_REQUESTED",
      ...
    }
  ]
}
```

### 1.3 Get Single Bonding Reject Record

**Endpoint:** `GET /api/bonding/reject/:id`

**Example:**
```
GET /api/bonding/reject/550e8400-e29b-41d4-a716-446655440000
```

### 1.4 Get by Batch Number

**Endpoint:** `GET /api/bonding/reject/batch/:batchNumber`

**Example:**
```
GET /api/bonding/reject/batch/BND-20250109-A-A-0001
```

### 1.5 Update Bonding Reject Record

**Endpoint:** `PUT /api/bonding/reject/:id`

**Request Body:** (All fields optional)
```json
{
  "ngQuantity": 120,
  "reason": "Updated reason",
  "status": "IN_PROGRESS"
}
```

### 1.6 Update Status Only

**Endpoint:** `PUT /api/bonding/reject/:id/status`

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

### 1.7 Delete Bonding Reject Record

**Endpoint:** `DELETE /api/bonding/reject/:id`

**Response:** `204 No Content`

---

## 2. Replacement API

### 2.1 Create Replacement Request

**Endpoint:** `POST /api/replacement`

**Request Body:**
```json
{
  "sourceDept": "BONDING",      // Required: BONDING, CUTTING, ASSEMBLY
  "targetDept": "CUTTING",      // Required: BONDING, CUTTING, ASSEMBLY
  "sourceBatchNumber": "BND-20250109-A-A-0001", // Required
  "requestedQty": 100,          // Required: >= 1
  "remarks": "Manual request",  // Optional
  "bondingRejectId": "uuid"     // Optional
}
```

### 2.2 List Replacement Requests

**Endpoint:** `GET /api/replacement`

**Query Parameters:**
- `sourceDept` (optional): BONDING, CUTTING, ASSEMBLY
- `targetDept` (optional): BONDING, CUTTING, ASSEMBLY
- `sourceBatchNumber` (optional): Filter by batch number
- `status` (optional): PENDING, IN_PROGRESS, COMPLETED, CANCELLED

**Example:**
```
GET /api/replacement?targetDept=CUTTING&status=PENDING
```

### 2.3 Get Replacement Statistics

**Endpoint:** `GET /api/replacement/statistics`

**Query Parameters:**
- `sourceDept` (optional)
- `targetDept` (optional)
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date

**Example:**
```
GET /api/replacement/statistics?sourceDept=BONDING&startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "byStatus": {
      "pending": 5,
      "inProgress": 10,
      "completed": 33,
      "cancelled": 2
    },
    "quantities": {
      "totalRequested": 5000,
      "totalProcessed": 4800,
      "remaining": 200
    }
  }
}
```

### 2.4 Get Single Replacement

**Endpoint:** `GET /api/replacement/:id`

### 2.5 Update Replacement

**Endpoint:** `PUT /api/replacement/:id`

**Request Body:** (All fields optional)
```json
{
  "processedQty": 50,
  "status": "IN_PROGRESS",
  "remarks": "Updated remarks"
}
```

### 2.6 Update Processed Quantity

**Endpoint:** `PUT /api/replacement/:id/processed-qty`

**Request Body:**
```json
{
  "processedQty": 75
}
```

**Note:** Status is automatically updated based on quantity:
- `processedQty = 0` → PENDING
- `0 < processedQty < requestedQty` → IN_PROGRESS
- `processedQty = requestedQty` → COMPLETED

### 2.7 Update Status Only

**Endpoint:** `PUT /api/replacement/:id/status`

**Request Body:**
```json
{
  "status": "CANCELLED"
}
```

### 2.8 Delete Replacement

**Endpoint:** `DELETE /api/replacement/:id`

---

## 3. Cutting Replacement API

### 3.1 Create Cutting Process

**Endpoint:** `POST /api/cutting/replacement`

**Request Body:**
```json
{
  "replacementId": "uuid",      // Required
  "processedQty": 0,            // Optional: Default 0
  "remarks": "Starting process", // Optional
  "operatorName": "Bob Wilson", // Optional
  "machineId": "CUT-01"         // Optional
}
```

### 3.2 Process Replacement (Main Endpoint)

**Endpoint:** `POST /api/cutting/replacement/process`

**Description:** Main endpoint for cutting department to process replacements. Auto-creates or updates cutting process and syncs with replacement progress.

**Request Body:**
```json
{
  "replacementId": "uuid",      // Required
  "processedQty": 50,           // Required: >= 0
  "operatorName": "Bob Wilson", // Optional
  "machineId": "CUT-01"         // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Replacement processed successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "replacementId": "660e8400-e29b-41d4-a716-446655440001",
    "processedQty": 50,
    "status": "IN_PROGRESS",
    "operatorName": "Bob Wilson",
    "machineId": "CUT-01",
    "startedAt": "2025-01-09T10:30:00.000Z",
    "completedAt": null,
    "createdAt": "2025-01-09T10:30:00.000Z",
    "updatedAt": "2025-01-09T10:30:00.000Z"
  }
}
```

### 3.3 List Cutting Processes

**Endpoint:** `GET /api/cutting/replacement`

**Query Parameters:**
- `replacementId` (optional): Filter by replacement ID
- `status` (optional): PENDING, IN_PROGRESS, COMPLETED, FAILED

**Example:**
```
GET /api/cutting/replacement?status=IN_PROGRESS
```

### 3.4 Get Cutting Statistics

**Endpoint:** `GET /api/cutting/replacement/statistics`

**Query Parameters:**
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "byStatus": {
      "pending": 3,
      "inProgress": 8,
      "completed": 32,
      "failed": 2
    },
    "totalProcessed": 4800
  }
}
```

### 3.5 Get Single Cutting Process

**Endpoint:** `GET /api/cutting/replacement/:id`

### 3.6 Update Cutting Process

**Endpoint:** `PUT /api/cutting/replacement/:id`

**Request Body:** (All fields optional)
```json
{
  "processedQty": 100,
  "status": "COMPLETED",
  "remarks": "Process completed",
  "operatorName": "Bob Wilson",
  "machineId": "CUT-01"
}
```

### 3.7 Update Status Only

**Endpoint:** `PUT /api/cutting/replacement/:id/status`

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

### 3.8 Delete Cutting Process

**Endpoint:** `DELETE /api/cutting/replacement/:id`

---

## 4. Notification API

### 4.1 Send Notification

**Endpoint:** `POST /api/notification`

**Request Body:**
```json
{
  "title": "Custom Notification",           // Required
  "message": "This is a custom message",    // Required
  "recipientRoles": ["ADMIN", "LEADER"],    // Required: Array of roles
  "type": "INFO",                           // Optional: INFO, WARNING, ERROR, SUCCESS
  "link": "/bonding/reject/123",            // Optional
  "relatedEntityType": "BondingReject",     // Optional
  "relatedEntityId": "uuid"                 // Optional
}
```

**Recipient Roles:**
- `ADMIN`
- `LEADER`
- `OPERATOR`
- `SUPERVISOR`
- `ALL`

### 4.2 List Notifications

**Endpoint:** `GET /api/notification`

**Query Parameters:**
- `recipientRole` (optional): ADMIN, LEADER, OPERATOR, SUPERVISOR, ALL
- `readStatus` (optional): true or false
- `type` (optional): INFO, WARNING, ERROR, SUCCESS
- `relatedEntityType` (optional): BondingReject, ReplacementProgress, CuttingProcess
- `relatedEntityId` (optional): UUID

**Example:**
```
GET /api/notification?recipientRole=ADMIN&readStatus=false&type=WARNING
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "title": "New Bonding NG Reject",
      "message": "Bonding NG detected: Batch BND-20250109-A-A-0001, Quantity: 100",
      "recipientRoles": ["ADMIN", "LEADER"],
      "type": "WARNING",
      "link": "/bonding/reject/550e8400-e29b-41d4-a716-446655440000",
      "readStatus": false,
      "relatedEntityType": "BondingReject",
      "relatedEntityId": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2025-01-09T10:00:00.000Z",
      "createdAt": "2025-01-09T10:00:00.000Z",
      "updatedAt": "2025-01-09T10:00:00.000Z"
    }
  ]
}
```

### 4.3 Get Unread Count

**Endpoint:** `GET /api/notification/unread-count`

**Query Parameters:**
- `recipientRole` (optional): Filter by role

**Example:**
```
GET /api/notification/unread-count?recipientRole=ADMIN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 12
  }
}
```

### 4.4 Get Single Notification

**Endpoint:** `GET /api/notification/:id`

### 4.5 Update Notification

**Endpoint:** `PUT /api/notification/:id`

**Request Body:** (All fields optional)
```json
{
  "readStatus": true,
  "title": "Updated title",
  "message": "Updated message"
}
```

### 4.6 Mark as Read

**Endpoint:** `PUT /api/notification/:id/read`

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { ... }
}
```

### 4.7 Mark Multiple as Read

**Endpoint:** `PUT /api/notification/read/multiple`

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 notifications marked as read"
}
```

### 4.8 Mark All as Read

**Endpoint:** `PUT /api/notification/read/all`

**Query Parameters:**
- `recipientRole` (optional): Only mark notifications for specific role

**Example:**
```
PUT /api/notification/read/all?recipientRole=ADMIN
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### 4.9 Delete Notification

**Endpoint:** `DELETE /api/notification/:id`

---

## 5. Document Upload API (Google Drive)

### 5.1 Upload Documents

**Endpoint:** `POST /api/documents/upload`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `files` (required): Multiple files (max 10)
- `deptCode` (required): Department code
- `docType` (required): Document type
- `shift` (required): Shift identifier
- `groupCode` (required): Group code (A or B)
- `category` (required): Category folder (e.g., "NG" or "PROD")

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.jpg" \
  -F "deptCode=PROD" \
  -F "docType=QC" \
  -F "shift=A" \
  -F "groupCode=A" \
  -F "category=NG"
```

**Response:**
```json
{
  "message": "Upload success",
  "documentNumber": "ZDI/PROD/QC/202501-A/A",
  "uploaded": [
    {
      "docNumber": "ZDI/PROD/QC/202501-A/A",
      "fileName": "file1.pdf",
      "driveLink": "https://drive.google.com/file/d/..."
    },
    {
      "docNumber": "ZDI/PROD/QC/202501-A/A",
      "fileName": "file2.jpg",
      "driveLink": "https://drive.google.com/file/d/..."
    }
  ]
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Resource deleted successfully |
| 400 | Bad Request - Validation error or invalid input |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Common Validation Errors

### Invalid Group
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Group must be either A or B",
  "error": "Bad Request"
}
```

### Invalid Quantity
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Processed quantity (150) cannot exceed requested quantity (100)",
  "error": "Bad Request"
}
```

### Missing Required Field
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "shift should not be empty",
    "ngQuantity must be a number conforming to the specified constraints"
  ],
  "error": "Bad Request"
}
```

### Resource Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Bonding reject with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

## Testing with Postman

### Import Collection

Create a Postman collection with the following structure:

1. **Bonding Reject**
   - Create NG Record
   - List Records
   - Get by ID
   - Update Record
   - Delete Record

2. **Replacement**
   - Create Request
   - List Requests
   - Get Statistics
   - Update Processed Qty

3. **Cutting**
   - Process Replacement
   - List Processes
   - Get Statistics

4. **Notification**
   - List Notifications
   - Get Unread Count
   - Mark as Read
   - Mark All as Read

### Environment Variables

```json
{
  "baseUrl": "http://localhost:5000/api",
  "bondingRejectId": "",
  "replacementId": "",
  "cuttingProcessId": "",
  "notificationId": ""
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production:

```typescript
// Example with @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10,
})
```

---

## Authentication (Future)

Currently no authentication is implemented. For production, consider adding:

1. JWT authentication
2. Role-based access control (RBAC)
3. API keys for external integrations

Example protected endpoint:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'LEADER')
@Post('bonding/reject/form-input')
```

---

## Webhooks (Future)

Consider implementing webhooks for real-time notifications:

```
POST /api/webhooks/subscribe
{
  "url": "https://your-app.com/webhook",
  "events": ["bonding.reject.created", "replacement.completed"]
}
```

---

## Support

For API issues or questions:
- Check response error messages
- Verify request body format
- Ensure all required fields are provided
- Check database connection
- Review server logs
