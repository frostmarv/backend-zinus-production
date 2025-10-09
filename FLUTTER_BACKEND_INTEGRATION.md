# Flutter App ↔ Backend Integration Guide

## 🎯 Overview

Flutter app **smart-production-app** sudah siap terintegrasi dengan backend **backend-zinus-production** yang baru dibuat.

---

## ✅ Status Integrasi

### Backend Endpoints (Ready) ✅

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/bonding/summary/form-input` | POST | Production data | ✅ Ready |
| `/api/bonding/reject/form-input` | POST | NG/reject data + workflow | ✅ Ready |
| `/api/replacement` | GET | List replacements | ✅ Ready |
| `/api/replacement/:id` | GET | Get replacement detail | ✅ Ready |
| `/api/cutting/replacement/process` | POST | Process replacement | ✅ Ready |
| `/api/notification` | GET | List notifications | ✅ Ready |
| `/api/documents/upload` | POST | Upload to Google Drive | ✅ Ready |

### Flutter App (Ready) ✅

| Screen | Repository Method | Backend Endpoint | Status |
|--------|------------------|------------------|--------|
| `InputSummaryBondingScreen` | `submitFormInput()` | `/api/bonding/summary/form-input` | ✅ Ready |
| `InputRejectBondingScreen` | `submitRejectFormInput()` | `/api/bonding/reject/form-input` | ✅ Ready |

---

## 🔗 Integration Points

### 1. Bonding Summary (Production Data)

**Flutter Screen:**
```dart
lib/screens/departments/bonding/summary/input_summary_bonding_screen.dart
```

**Repository Method:**
```dart
BondingRepository.submitFormInput(formData)
```

**Backend Endpoint:**
```
POST /api/bonding/summary/form-input
```

**Request Format:**
```json
{
  "timestamp": "2025-01-09T10:00:00Z",
  "shift": "1",
  "group": "A",
  "time_slot": "08.00 - 09.00",
  "machine": "BND-01",
  "kashift": "Noval",
  "admin": "Aline",
  "customer": "ACME Corp",
  "po_number": "PO-2025-001",
  "customer_po": "CUST-PO-123",
  "sku": "SKU-12345",
  "week": "W01",
  "quantity_produksi": 1000
}
```

**Backend Response:**
```json
{
  "success": true,
  "message": "Bonding summary created successfully",
  "data": {
    "id": 1,
    "timestamp": "2025-01-09T10:00:00Z",
    ...
  }
}
```

**What Happens:**
1. ✅ Save to database
2. ✅ Auto-log to Google Sheets ("Bonding Summary")
3. ✅ Return success response

---

### 2. Bonding Reject (NG Data + Workflow)

**Flutter Screen:**
```dart
lib/screens/departments/bonding/reject/input_reject_bonding_screen.dart
```

**Repository Method:**
```dart
BondingRepository.submitRejectFormInput(formData)
```

**Backend Endpoint:**
```
POST /api/bonding/reject/form-input
```

**Request Format:**
```json
{
  "shift": "A",
  "group": "A",
  "timeSlot": "08.00 - 09.00",
  "machine": "BND-01",
  "kashift": "Noval",
  "admin": "Aline",
  "customer": "ACME Corp",
  "poNumber": "PO-2025-001",
  "customerPo": "CUST-PO-123",
  "sku": "SKU-12345",
  "sCode": "S-001",
  "ngQuantity": 100,
  "reason": "Adhesive defect"
}
```

**Backend Response:**
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
      "requestedQty": 100,
      "processedQty": 0,
      "status": "PENDING",
      ...
    }
  }
}
```

**What Happens:**
1. ✅ Auto-generate batch number: `BND-20250109-A-A-0001`
2. ✅ Save to database
3. ✅ **Auto-create replacement request** (BONDING → CUTTING)
4. ✅ Update status to `REPLACEMENT_REQUESTED`
5. ✅ **Send notifications** to ADMIN & LEADER
6. ✅ **Auto-log to Google Sheets** ("NG Log")

---

## 🔧 Configuration

### Backend Configuration

**File:** `backend-zinus-production/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_TYPE=sqlite
DB_DATABASE=dev.sqlite
DB_SYNCHRONIZE=true
DB_LOGGING=true

# CORS - Allow Flutter app
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Flutter Configuration

**File:** `smart-production-app/.env`

```env
# Backend API URL
API_BASE_URL=http://localhost:5000
# or
API_BASE_URL=https://your-backend-url.com
```

**File:** `smart-production-app/lib/services/environment_service.dart`

Pastikan service ini membaca `API_BASE_URL` dari `.env`:

```dart
class EnvironmentService {
  static String get apiBaseUrl {
    return dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000';
  }
}
```

---

## 🚀 Testing Integration

### Step 1: Start Backend

```bash
cd backend-zinus-production
npm run start:dev
```

Backend runs on: `http://localhost:5000`

### Step 2: Update Flutter .env

```env
API_BASE_URL=http://localhost:5000
```

### Step 3: Run Flutter App

```bash
cd smart-production-app
flutter run
```

### Step 4: Test Bonding Summary

1. Open app
2. Navigate to Bonding → Summary
3. Fill form
4. Submit
5. Check backend logs
6. Verify Google Sheets

### Step 5: Test Bonding Reject

1. Navigate to Bonding → Reject
2. Fill form (NG data)
3. Submit
4. Check backend logs
5. Verify:
   - Batch number generated
   - Replacement created
   - Notifications sent
   - Google Sheets logged

---

## 📊 Data Flow

### Bonding Summary Flow

```
Flutter App
    ↓
POST /api/bonding/summary/form-input
    ↓
Backend (BondingController)
    ↓
Save to Database (bonding_summary)
    ↓
Log to Google Sheets ("Bonding Summary")
    ↓
Return Response
    ↓
Flutter App (Show Success)
```

### Bonding Reject Flow

```
Flutter App
    ↓
POST /api/bonding/reject/form-input
    ↓
Backend (BondingRejectController)
    ↓
1. Generate Batch Number
    ↓
2. Save to Database (bonding_reject)
    ↓
3. Create Replacement Request
    ↓
4. Update Status
    ↓
5. Send Notifications
    ↓
6. Log to Google Sheets ("NG Log")
    ↓
Return Response (with batch number & replacement)
    ↓
Flutter App (Show Success with batch number)
```

---

## 🔍 Field Mapping

### Flutter → Backend Field Mapping

| Flutter Field | Backend Field | Notes |
|--------------|---------------|-------|
| `shift` | `shift` | "1" or "2" in Flutter, "A" or "B" in backend |
| `group` | `group` | "A" or "B" (same) |
| `time_slot` | `timeSlot` | Format: "08.00 - 09.00" |
| `machine` | `machine` | Machine ID |
| `kashift` | `kashift` | Operator name |
| `admin` | `admin` | Admin name |
| `customer` | `customer` | Customer name |
| `po_number` | `poNumber` | PO number |
| `customer_po` | `customerPo` | Customer PO |
| `sku` | `sku` | SKU code |
| `s_code` | `sCode` | S.CODE (reject only) |
| `ng_quantity` | `ngQuantity` | NG quantity (reject only) |
| `reason` | `reason` | Reason (reject only) |

### ⚠️ Shift Mapping Issue

**Flutter uses:** `"1"` or `"2"`  
**Backend expects:** `"A"` or `"B"`

**Solution:** Update Flutter to send "A" or "B", or update backend to accept "1" or "2".

**Recommended:** Update Flutter screen to use "A" and "B" directly.

---

## 🔧 Required Changes

### Option 1: Update Flutter (Recommended)

**File:** `smart-production-app/lib/screens/departments/bonding/reject/input_reject_bonding_screen.dart`

Change shift dropdown from "1"/"2" to "A"/"B":

```dart
// Current
String? _selectedShift = '1';

// Change to
String? _selectedShift = 'A';

// Update dropdown options
final shiftOptions = [
  {'value': 'A', 'label': 'Shift A'},
  {'value': 'B', 'label': 'Shift B'},
];
```

### Option 2: Update Backend

**File:** `backend-zinus-production/src/modules/bonding-reject/entities/bonding-reject.entity.ts`

```typescript
export enum ShiftType {
  ONE = '1',
  TWO = '2',
}
```

**Recommended:** Use Option 1 (update Flutter) untuk konsistensi dengan backend yang baru.

---

## 📱 Flutter UI Updates (Optional)

### Show Batch Number After Submit

**File:** `input_reject_bonding_screen.dart`

Update success message to show batch number:

```dart
Future<void> _submitForm() async {
  // ... existing code ...
  
  try {
    final response = await BondingRepository.submitRejectFormInput(formData);
    if (mounted) {
      final batchNumber = response['data']?['bondingReject']?['batchNumber'];
      final message = batchNumber != null
          ? 'Data NG berhasil disimpan!\nBatch Number: $batchNumber'
          : 'Data NG berhasil disimpan!';
      _showSuccess(message);
      Navigator.of(context).pop();
    }
  } catch (e) {
    // ... error handling ...
  }
}
```

### Show Replacement Info

```dart
void _showSuccessWithDetails(Map<String, dynamic> response) {
  final bondingReject = response['data']?['bondingReject'];
  final replacement = response['data']?['replacement'];
  
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('✅ Berhasil'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Batch Number: ${bondingReject?['batchNumber']}'),
          const SizedBox(height: 8),
          Text('Status: ${bondingReject?['status']}'),
          const SizedBox(height: 8),
          Text('Replacement ID: ${replacement?['id']}'),
          const SizedBox(height: 8),
          Text('Requested Qty: ${replacement?['requestedQty']}'),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
            Navigator.of(context).pop();
          },
          child: const Text('OK'),
        ),
      ],
    ),
  );
}
```

---

## 🧪 Testing Checklist

### Backend Testing

- [ ] Start backend server
- [ ] Test `/api/bonding/summary/form-input` with Postman
- [ ] Test `/api/bonding/reject/form-input` with Postman
- [ ] Verify batch number generation
- [ ] Verify replacement creation
- [ ] Verify notifications sent
- [ ] Verify Google Sheets logging
- [ ] Check database records

### Flutter Testing

- [ ] Update `.env` with backend URL
- [ ] Run Flutter app
- [ ] Test bonding summary form
- [ ] Test bonding reject form
- [ ] Verify success messages
- [ ] Check error handling
- [ ] Test with invalid data
- [ ] Test network errors

### Integration Testing

- [ ] Submit from Flutter
- [ ] Verify backend receives data
- [ ] Check database records
- [ ] Verify Google Sheets updated
- [ ] Check notifications created
- [ ] Verify replacement created
- [ ] Test complete workflow

---

## 🐛 Troubleshooting

### Issue: "Network Error"

**Solution:**
1. Check backend is running
2. Verify `API_BASE_URL` in Flutter `.env`
3. Check CORS configuration in backend
4. Test backend endpoint with Postman

### Issue: "Validation Error"

**Solution:**
1. Check field names match
2. Verify data types
3. Check required fields
4. Review backend validation rules

### Issue: "Shift validation failed"

**Solution:**
- Update Flutter to send "A" or "B" instead of "1" or "2"
- Or update backend to accept "1" or "2"

### Issue: "Google Sheets not updating"

**Solution:**
1. Check `service-account.json` exists
2. Verify spreadsheet is shared
3. Check backend logs for errors
4. Test manual export endpoint

---

## 📊 Response Handling

### Success Response

```dart
// Backend returns
{
  "success": true,
  "message": "...",
  "data": { ... }
}

// Flutter handles
if (response['success'] == true) {
  final data = response['data'];
  // Process data
}
```

### Error Response

```dart
// Backend returns
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}

// Flutter handles
try {
  final response = await BondingRepository.submitRejectFormInput(formData);
} catch (e) {
  // Show error message
  _showError(e.toString());
}
```

---

## 🎯 Next Steps

### Immediate

1. ✅ Update Flutter shift field to use "A"/"B"
2. ✅ Test bonding summary integration
3. ✅ Test bonding reject integration
4. ✅ Verify Google Sheets logging

### Short Term

1. Add replacement list screen in Flutter
2. Add cutting process screen in Flutter
3. Add notification screen in Flutter
4. Add document upload screen in Flutter

### Long Term

1. Implement offline mode in Flutter
2. Add sync mechanism
3. Add real-time notifications (WebSocket)
4. Add dashboard with statistics

---

## 📝 Summary

### ✅ Ready for Integration

**Backend:**
- ✅ All endpoints ready
- ✅ Auto batch number generation
- ✅ Auto replacement creation
- ✅ Auto notifications
- ✅ Google Sheets integration

**Flutter:**
- ✅ Screens ready
- ✅ Repository methods ready
- ✅ HTTP client configured
- ⚠️ Need shift field update (1/2 → A/B)

### 🔧 Required Changes

1. **Flutter:** Update shift field from "1"/"2" to "A"/"B"
2. **Flutter:** Update `.env` with backend URL
3. **Backend:** Configure CORS for Flutter app

### 🚀 Ready to Deploy

After making the required changes, the integration is ready for testing and deployment!

---

**Last Updated:** January 9, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for Integration
