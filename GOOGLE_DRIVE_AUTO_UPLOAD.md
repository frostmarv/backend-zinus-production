# Google Drive Auto Upload - Bonding Reject Images

## 🎯 Overview

Images uploaded untuk bonding reject akan **otomatis** di-upload ke Google Drive dengan struktur folder yang terorganisir.

---

## 📁 Folder Structure

```
ZinusDreamIndonesia (Root: 18kSzEb6hl8OCtMsgWwSV_ghszcMK2b31)
└── Bonding-Reject/
    └── 2025/
        └── 01/
            └── BND-20250109-A-A-0001/
                ├── image1.jpg
                ├── image2.jpg
                └── image3.jpg
```

**Format:**
```
ZinusDreamIndonesia/Bonding-Reject/YYYY/MM/BATCH-NUMBER/
```

**Example:**
```
ZinusDreamIndonesia/Bonding-Reject/2025/01/BND-20250109-A-A-0001/
```

---

## 🔧 Configuration

### Root Folder ID

**File:** `backend-zinus-production/src/services/google-drive.service.ts`

```typescript
private readonly ROOT_FOLDER_ID = '18kSzEb6hl8OCtMsgWwSV_ghszcMK2b31';
```

### Service Account Setup

1. **Share root folder** dengan service account email
2. **Permission:** Editor
3. **Service account** akan otomatis create sub-folders

---

## 🚀 How It Works

### Step 1: Upload Images via API

```bash
POST /api/bonding/reject/{id}/upload-images
Content-Type: multipart/form-data

images: [file1.jpg, file2.jpg, file3.jpg]
```

### Step 2: Backend Process

1. ✅ Verify bonding reject exists
2. ✅ Get batch number (e.g., `BND-20250109-A-A-0001`)
3. ✅ Create/find folder structure:
   - `Bonding-Reject` (in root)
   - `2025` (in Bonding-Reject)
   - `01` (in 2025)
   - `BND-20250109-A-A-0001` (in 01)
4. ✅ Upload all images to batch folder
5. ✅ Delete local files after upload
6. ✅ Return Google Drive links

### Step 3: Response

```json
{
  "success": true,
  "message": "3 images uploaded successfully to Google Drive",
  "data": {
    "bondingRejectId": "uuid",
    "batchNumber": "BND-20250109-A-A-0001",
    "files": [
      {
        "filename": "image1.jpg",
        "driveFileId": "1abc...",
        "driveLink": "https://drive.google.com/file/d/1abc.../view",
        "size": 245678
      },
      {
        "filename": "image2.jpg",
        "driveFileId": "2def...",
        "driveLink": "https://drive.google.com/file/d/2def.../view",
        "size": 189234
      },
      {
        "filename": "image3.jpg",
        "driveFileId": "3ghi...",
        "driveLink": "https://drive.google.com/file/d/3ghi.../view",
        "size": 312456
      }
    ]
  }
}
```

---

## 📊 Features

### ✅ Auto Folder Creation

- **Smart folder detection:** Check if folder exists before creating
- **Hierarchical structure:** Year → Month → Batch Number
- **No duplicates:** Reuses existing folders

### ✅ File Management

- **Unique filenames:** Preserved from upload
- **Metadata:** File size, type, Drive link
- **Local cleanup:** Files deleted after successful upload

### ✅ Error Handling

- **Graceful fallback:** Returns local file info if Drive upload fails
- **Detailed logging:** All operations logged
- **Non-blocking:** Main process continues even if upload fails

---

## 🧪 Testing

### Test Upload

```bash
# 1. Create bonding reject
curl -X POST http://localhost:5000/api/bonding/reject/form-input \
  -H "Content-Type: application/json" \
  -d '{
    "shift": "A",
    "group": "A",
    "timeSlot": "08:00-16:00",
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

# Response will include:
# "batchNumber": "BND-20250109-A-A-0001"
# "id": "uuid-123"

# 2. Upload images
curl -X POST http://localhost:5000/api/bonding/reject/uuid-123/upload-images \
  -F "images=@test1.jpg" \
  -F "images=@test2.jpg" \
  -F "images=@test3.jpg"

# 3. Check Google Drive
# Navigate to: ZinusDreamIndonesia/Bonding-Reject/2025/01/BND-20250109-A-A-0001/
# Verify images are uploaded
```

### Verify Folder Structure

1. Open Google Drive
2. Navigate to `ZinusDreamIndonesia`
3. Check folder structure:
   ```
   ZinusDreamIndonesia/
   └── Bonding-Reject/
       └── 2025/
           └── 01/
               └── BND-20250109-A-A-0001/
                   ├── test1.jpg
                   ├── test2.jpg
                   └── test3.jpg
   ```

---

## 🔍 API Details

### Endpoint

```
POST /api/bonding/reject/:id/upload-images
```

### Request

**Headers:**
```
Content-Type: multipart/form-data
```

**Body:**
```
images: File[] (max 10 files)
```

**Allowed types:**
- image/jpeg
- image/jpg
- image/png
- image/gif

**Max file size:** No limit (but recommended < 10MB per file)

### Response - Success

```json
{
  "success": true,
  "message": "3 images uploaded successfully to Google Drive",
  "data": {
    "bondingRejectId": "uuid",
    "batchNumber": "BND-20250109-A-A-0001",
    "files": [
      {
        "filename": "image1.jpg",
        "driveFileId": "1abc...",
        "driveLink": "https://drive.google.com/file/d/1abc.../view",
        "size": 245678
      }
    ]
  }
}
```

### Response - Error

```json
{
  "success": false,
  "message": "Failed to upload to Google Drive: Permission denied",
  "data": {
    "bondingRejectId": "uuid",
    "batchNumber": "BND-20250109-A-A-0001",
    "files": [
      {
        "filename": "1704801234567-123456789.jpg",
        "originalname": "image1.jpg",
        "path": "./uploads/bonding-reject/1704801234567-123456789.jpg",
        "size": 245678,
        "mimetype": "image/jpeg"
      }
    ]
  }
}
```

---

## 🔐 Security

### Service Account Permissions

**Required:**
- ✅ Google Drive API enabled
- ✅ Service account has Editor access to root folder
- ✅ Can create folders
- ✅ Can upload files

### File Validation

- ✅ Only image files allowed (JPEG, PNG, GIF)
- ✅ File type validation
- ✅ Bonding reject ID validation

---

## 📝 Code Changes

### Files Modified

1. **`src/services/google-drive.service.ts`**
   - ✅ Added `ROOT_FOLDER_ID`
   - ✅ Added `uploadFileFromPath()`
   - ✅ Added `findFolder()`
   - ✅ Added `getOrCreateFolder()`
   - ✅ Added `uploadBondingRejectImages()`

2. **`src/modules/bonding-reject/bonding-reject.controller.ts`**
   - ✅ Injected `GoogleDriveService`
   - ✅ Updated `uploadImages()` endpoint
   - ✅ Auto-upload to Google Drive

3. **`src/modules/bonding-reject/bonding-reject.module.ts`**
   - ✅ Added `GoogleDriveService` provider

---

## 🎯 Benefits

### For Users

- ✅ **Automatic backup:** Images safely stored in Google Drive
- ✅ **Organized structure:** Easy to find images by date and batch
- ✅ **Shareable links:** Direct links to view images
- ✅ **No manual upload:** Everything automatic

### For Admins

- ✅ **Centralized storage:** All images in one place
- ✅ **Easy access:** Navigate by year/month/batch
- ✅ **Audit trail:** Track all uploaded images
- ✅ **Space efficient:** No local storage needed

---

## 🐛 Troubleshooting

### Issue: "Permission denied"

**Solution:**
1. Check service account has access to root folder
2. Verify folder ID is correct
3. Check service account email in Google Drive sharing

### Issue: "Folder not found"

**Solution:**
1. Verify root folder ID: `18kSzEb6hl8OCtMsgWwSV_ghszcMK2b31`
2. Check folder exists in Google Drive
3. Verify service account has access

### Issue: "Upload failed"

**Solution:**
1. Check Google Drive API is enabled
2. Verify service account credentials
3. Check network connectivity
4. Review backend logs

### Issue: "Files not deleted locally"

**Solution:**
1. Check file permissions
2. Verify upload was successful
3. Check error logs

---

## 📊 Monitoring

### Logs to Check

```bash
# Success
✅ Uploaded image1.jpg to Google Drive
📁 Found existing folder: 2025
📁 Creating new folder: BND-20250109-A-A-0001
📁 Folder structure ready: Bonding-Reject/2025/01/BND-20250109-A-A-0001
✅ Uploaded 3 images to Google Drive

# Error
❌ Failed to upload images to Google Drive: Permission denied
⚠️ Google Drive upload failed, keeping local files
```

---

## 🔄 Workflow Integration

### Complete Flow

```
1. User creates bonding reject
   ↓
2. Backend generates batch number
   ↓
3. User uploads images via Flutter app
   ↓
4. Backend receives images
   ↓
5. Backend creates folder structure in Google Drive
   ↓
6. Backend uploads images to Google Drive
   ↓
7. Backend deletes local files
   ↓
8. Backend returns Google Drive links
   ↓
9. Flutter app shows success with links
```

---

## 📱 Flutter Integration

### Repository Method

**File:** `lib/repositories/departments/bonding_repository.dart`

```dart
static Future<Map<String, dynamic>> uploadImages(
  String bondingRejectId,
  List<File> images,
) async {
  final uri = Uri.parse('${HttpClient.baseUrl}/api/bonding/reject/$bondingRejectId/upload-images');
  final request = http.MultipartRequest('POST', uri);
  
  for (var i = 0; i < images.length; i++) {
    request.files.add(
      await http.MultipartFile.fromPath(
        'images',
        images[i].path,
        filename: 'image_$i${path.extension(images[i].path)}',
      ),
    );
  }
  
  final streamedResponse = await request.send();
  final response = await http.Response.fromStream(streamedResponse);
  
  if (response.statusCode == 200 || response.statusCode == 201) {
    final data = json.decode(response.body);
    
    // Extract Google Drive links
    final files = data['data']['files'] as List;
    for (var file in files) {
      print('📁 Uploaded: ${file['filename']}');
      print('🔗 Link: ${file['driveLink']}');
    }
    
    return data;
  } else {
    throw Exception('Failed to upload images');
  }
}
```

---

## ✅ Summary

### What's Implemented

1. ✅ **Auto folder creation** in Google Drive
2. ✅ **Hierarchical structure** (Year/Month/Batch)
3. ✅ **Smart folder detection** (reuse existing)
4. ✅ **Multiple image upload** (max 10)
5. ✅ **File validation** (JPEG, PNG, GIF)
6. ✅ **Local cleanup** (delete after upload)
7. ✅ **Error handling** (graceful fallback)
8. ✅ **Detailed logging** (all operations)

### Root Folder

**ID:** `18kSzEb6hl8OCtMsgWwSV_ghszcMK2b31`  
**Name:** ZinusDreamIndonesia  
**Structure:** `Bonding-Reject/YYYY/MM/BATCH-NUMBER/`

---

**Status:** ✅ Complete & Ready  
**Last Updated:** January 9, 2025  
**Version:** 1.0.0
