# Bonding NG → Replacement → Cutting Workflow

## Overview

Complete NestJS backend system for managing bonding NG (Not Good) workflow with automatic replacement requests and cutting process tracking.

## Architecture

```
Bonding NG Reject → Replacement Request → Cutting Process
        ↓                    ↓                    ↓
   Notifications        Notifications       Notifications
```

## Modules

### 1. Bonding Reject Module
**Path:** `src/modules/bonding-reject/`

**Entity:** `BondingReject`
- Auto-generated batch number: `BND-YYYYMMDD-SHIFT-GROUP-XXXX`
- Example: `BND-20250109-A-A-0001`
- Tracks NG quantity, reason, machine, operator details
- Status: PENDING → REPLACEMENT_REQUESTED → IN_PROGRESS → COMPLETED

**Endpoints:**
```
POST   /bonding/reject/form-input    - Create NG record + auto-create replacement
GET    /bonding/reject                - List all records (with filters)
GET    /bonding/reject/:id            - Get single record
GET    /bonding/reject/batch/:batchNumber - Get by batch number
PUT    /bonding/reject/:id            - Update record
PUT    /bonding/reject/:id/status     - Update status only
DELETE /bonding/reject/:id            - Delete record
```

**Validation:**
- Group must be 'A' or 'B' only
- Shift must be 'A' or 'B' only
- NG quantity must be >= 1

### 2. Replacement Module
**Path:** `src/modules/replacement/`

**Entity:** `ReplacementProgress`
- Tracks replacement requests between departments
- Links to original bonding reject
- Monitors requested vs processed quantities
- Status: PENDING → IN_PROGRESS → COMPLETED → CANCELLED

**Endpoints:**
```
POST   /replacement                   - Create replacement request
GET    /replacement                   - List all (filter by dept, batch, status)
GET    /replacement/statistics        - Get statistics
GET    /replacement/:id               - Get single record
PUT    /replacement/:id               - Update record
PUT    /replacement/:id/processed-qty - Update processed quantity
PUT    /replacement/:id/status        - Update status only
DELETE /replacement/:id               - Delete record
```

**Features:**
- Auto-updates status based on processed quantity
- Validates processed qty doesn't exceed requested qty
- Provides statistics (total, by status, quantities)

### 3. Cutting Replacement Module
**Path:** `src/modules/cutting-replacement/`

**Entity:** `CuttingProcess`
- Links to replacement request
- Tracks cutting progress
- Records operator, machine, timestamps
- Status: PENDING → IN_PROGRESS → COMPLETED → FAILED

**Endpoints:**
```
POST   /cutting/replacement           - Create cutting process
POST   /cutting/replacement/process   - Process replacement (main endpoint)
GET    /cutting/replacement           - List all (filter by replacement, status)
GET    /cutting/replacement/statistics - Get statistics
GET    /cutting/replacement/:id       - Get single record
PUT    /cutting/replacement/:id       - Update record
PUT    /cutting/replacement/:id/status - Update status only
DELETE /cutting/replacement/:id       - Delete record
```

**Key Feature - Process Replacement:**
```json
POST /cutting/replacement/process
{
  "replacementId": "uuid",
  "processedQty": 100,
  "operatorName": "John Doe",
  "machineId": "CUT-01"
}
```
- Auto-creates or updates cutting process
- Syncs with replacement progress
- Auto-updates statuses based on quantity

### 4. Notification Module
**Path:** `src/modules/notification/`

**Entity:** `Notification`
- Multi-role targeting (ADMIN, LEADER, OPERATOR, SUPERVISOR, ALL)
- Types: INFO, WARNING, ERROR, SUCCESS
- Read/unread status tracking
- Links to related entities

**Endpoints:**
```
POST   /notification                  - Send notification
GET    /notification                  - List all (filter by role, status, type)
GET    /notification/unread-count     - Get unread count
GET    /notification/:id              - Get single notification
PUT    /notification/:id              - Update notification
PUT    /notification/:id/read         - Mark as read
PUT    /notification/read/multiple    - Mark multiple as read
PUT    /notification/read/all         - Mark all as read
DELETE /notification/:id              - Delete notification
```

**Auto-Notifications:**
- Bonding NG created → Notifies ADMIN, LEADER
- Replacement created → Notifies ADMIN, SUPERVISOR
- Replacement completed → Notifies ADMIN, LEADER
- Cutting process updated → Notifies ADMIN, SUPERVISOR

## Complete Workflow Example

### Step 1: Create Bonding NG Record

```bash
POST /bonding/reject/form-input
Content-Type: application/json

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
    "bondingReject": {
      "id": "uuid-1",
      "batchNumber": "BND-20250109-A-A-0001",
      "ngQuantity": 100,
      "status": "REPLACEMENT_REQUESTED",
      ...
    },
    "replacement": {
      "id": "uuid-2",
      "sourceDept": "BONDING",
      "targetDept": "CUTTING",
      "sourceBatchNumber": "BND-20250109-A-A-0001",
      "requestedQty": 100,
      "processedQty": 0,
      "status": "PENDING",
      ...
    }
  }
}
```

**What Happens Automatically:**
1. ✅ Batch number generated: `BND-20250109-A-A-0001`
2. ✅ Bonding reject record saved
3. ✅ Replacement request created (BONDING → CUTTING)
4. ✅ Bonding reject status updated to `REPLACEMENT_REQUESTED`
5. ✅ Notification sent to ADMIN & LEADER
6. ✅ Notification sent to ADMIN & SUPERVISOR

### Step 2: Cutting Department Processes Replacement

```bash
POST /cutting/replacement/process
Content-Type: application/json

{
  "replacementId": "uuid-2",
  "processedQty": 50,
  "operatorName": "Bob Wilson",
  "machineId": "CUT-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Replacement processed successfully",
  "data": {
    "id": "uuid-3",
    "replacementId": "uuid-2",
    "processedQty": 50,
    "status": "IN_PROGRESS",
    "operatorName": "Bob Wilson",
    "machineId": "CUT-01",
    "startedAt": "2025-01-09T10:30:00Z",
    ...
  }
}
```

**What Happens:**
1. ✅ Cutting process created/updated
2. ✅ Replacement progress updated (50/100)
3. ✅ Statuses auto-updated to `IN_PROGRESS`
4. ✅ Notification sent to ADMIN & SUPERVISOR

### Step 3: Complete Processing

```bash
POST /cutting/replacement/process
Content-Type: application/json

{
  "replacementId": "uuid-2",
  "processedQty": 100,
  "operatorName": "Bob Wilson",
  "machineId": "CUT-01"
}
```

**What Happens:**
1. ✅ Cutting process updated
2. ✅ Replacement progress updated (100/100)
3. ✅ Statuses auto-updated to `COMPLETED`
4. ✅ Completion timestamp recorded
5. ✅ Notification sent: "Replacement Completed"

### Step 4: Check Notifications

```bash
GET /notification?recipientRole=ADMIN&readStatus=false
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "notif-1",
      "title": "Replacement Completed",
      "message": "Replacement for batch BND-20250109-A-A-0001 completed. Processed: 100",
      "recipientRoles": ["ADMIN", "LEADER"],
      "type": "SUCCESS",
      "readStatus": false,
      "timestamp": "2025-01-09T11:00:00Z"
    },
    ...
  ]
}
```

## Database Schema

### Tables Created

1. **bonding_reject**
   - id (uuid, PK)
   - batch_number (unique)
   - timestamp
   - shift (enum: A, B)
   - group (enum: A, B)
   - time_slot
   - machine
   - kashift
   - admin
   - customer
   - po_number
   - customer_po
   - sku
   - s_code
   - ng_quantity (int)
   - reason (text)
   - status (enum)
   - created_at
   - updated_at

2. **replacement_progress**
   - id (uuid, PK)
   - source_dept (enum)
   - target_dept (enum)
   - source_batch_number
   - requested_qty (int)
   - processed_qty (int)
   - status (enum)
   - remarks (text)
   - bonding_reject_id (FK)
   - created_at
   - updated_at

3. **cutting_process**
   - id (uuid, PK)
   - replacement_id (FK)
   - processed_qty (int)
   - status (enum)
   - remarks (text)
   - operator_name
   - machine_id
   - started_at
   - completed_at
   - created_at
   - updated_at

4. **notification**
   - id (uuid, PK)
   - title
   - message (text)
   - recipient_roles (array)
   - type (enum)
   - link
   - read_status (boolean)
   - related_entity_type
   - related_entity_id
   - timestamp
   - created_at
   - updated_at

## Installation & Setup

### 1. Database Configuration

The system uses TypeORM with `autoLoadEntities: true` and `synchronize` enabled in development.

**For Development (SQLite):**
```env
DB_TYPE=sqlite
DB_DATABASE=dev.sqlite
DB_SYNCHRONIZE=true
DB_LOGGING=true
```

**For Production (PostgreSQL):**
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

### 2. Run Migrations (Production)

For production, disable `synchronize` and use migrations:

```bash
# Generate migration
npm run typeorm migration:generate -- -n BondingNGWorkflow

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

### 3. Start Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Testing

### Test Complete Workflow

```bash
# 1. Create bonding NG
curl -X POST http://localhost:3000/bonding/reject/form-input \
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

# 2. Get replacement requests
curl http://localhost:3000/replacement?targetDept=CUTTING&status=PENDING

# 3. Process replacement (use replacementId from step 2)
curl -X POST http://localhost:3000/cutting/replacement/process \
  -H "Content-Type: application/json" \
  -d '{
    "replacementId": "your-replacement-id",
    "processedQty": 100,
    "operatorName": "Bob Wilson",
    "machineId": "CUT-01"
  }'

# 4. Check notifications
curl http://localhost:3000/notification?recipientRole=ADMIN&readStatus=false

# 5. Mark notification as read
curl -X PUT http://localhost:3000/notification/{notification-id}/read
```

## Statistics & Reporting

### Replacement Statistics

```bash
GET /replacement/statistics?sourceDept=BONDING&targetDept=CUTTING&startDate=2025-01-01&endDate=2025-01-31
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

### Cutting Statistics

```bash
GET /cutting/replacement/statistics?startDate=2025-01-01&endDate=2025-01-31
```

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

### Unread Notifications Count

```bash
GET /notification/unread-count?recipientRole=ADMIN
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

## Features

### ✅ Auto-Generated Batch Numbers
- Format: `BND-YYYYMMDD-SHIFT-GROUP-XXXX`
- Sequential numbering per day/shift/group
- Unique constraint enforced

### ✅ Automatic Workflow
- Bonding NG → Auto-creates replacement request
- Replacement → Auto-syncs with cutting process
- Status updates → Auto-triggered by quantity changes

### ✅ Validation
- Group must be A or B
- Shift must be A or B
- Processed qty cannot exceed requested qty
- All required fields validated

### ✅ Notifications
- Multi-role targeting
- Auto-sent on key events
- Read/unread tracking
- Bulk operations (mark all as read)

### ✅ Logging
- All transactions logged
- Service-level logging with context
- Error tracking

### ✅ Statistics
- Real-time statistics
- Filterable by date, department, status
- Quantity tracking

## Error Handling

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Processed quantity (150) cannot exceed requested quantity (100)",
  "error": "Bad Request"
}
```

Common errors:
- `400 Bad Request` - Validation errors
- `404 Not Found` - Entity not found
- `500 Internal Server Error` - Server errors

## Security Considerations

1. **Input Validation:** All DTOs use class-validator
2. **Whitelist:** ValidationPipe with `whitelist: true`
3. **Transform:** Auto-transform types
4. **Logging:** All critical operations logged
5. **Error Messages:** No sensitive data exposed

## Next Steps

1. ✅ Add authentication/authorization (JWT, roles)
2. ✅ Implement WebSocket for real-time notifications
3. ✅ Add file upload for NG evidence photos
4. ✅ Create dashboard endpoints for analytics
5. ✅ Add email notifications
6. ✅ Implement audit trail
7. ✅ Add data export (Excel, PDF)

## Support

For issues or questions:
- Check logs in console
- Verify database connection
- Ensure all modules are imported in app.module.ts
- Check entity relationships are properly configured
