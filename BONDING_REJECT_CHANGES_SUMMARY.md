# Bonding Reject Changes Summary

## ✅ Changes Completed

### Backend Changes (Complete) ✅

#### 1. DTO Updated - Machine is Optional
**File:** `backend-zinus-production/src/modules/bonding-reject/dto/create-bonding-reject.dto.ts`

```typescript
// Before
@IsString()
@IsNotEmpty()
machine: string;

// After
@IsString()
@IsOptional()
machine?: string;
```

#### 2. Entity Updated - Machine Column Nullable
**File:** `backend-zinus-production/src/modules/bonding-reject/entities/bonding-reject.entity.ts`

```typescript
// Before
@Column()
machine: string;

// After
@Column({ nullable: true })
machine: string;
```

#### 3. Controller Updated - Image Upload Endpoint Added
**File:** `backend-zinus-production/src/modules/bonding-reject/bonding-reject.controller.ts`

**New Endpoint:**
```
POST /api/bonding/reject/:id/upload-images
```

**Features:**
- ✅ Upload up to 10 images
- ✅ Accepts JPEG, PNG, GIF
- ✅ Auto-creates upload directory
- ✅ Unique filename generation
- ✅ File validation
- ✅ Returns uploaded file info

**Request:**
```bash
curl -X POST http://localhost:5000/api/bonding/reject/{id}/upload-images \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "3 images uploaded successfully",
  "data": {
    "bondingRejectId": "uuid",
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

#### 4. Upload Directory Created
**Path:** `backend-zinus-production/uploads/bonding-reject/`

---

### Flutter Changes Required ⚠️

#### 1. Add Image Picker Dependency

**File:** `smart-production-app/pubspec.yaml`

```yaml
dependencies:
  image_picker: ^1.0.7  # ✅ Already added
```

**Run:**
```bash
cd smart-production-app
flutter pub get
```

#### 2. Update Input Reject Screen

**File:** `smart-production-app/lib/screens/departments/bonding/reject/input_reject_bonding_screen.dart`

**Changes needed:**

##### A. Add Imports
```dart
import 'package:image_picker/image_picker.dart';
import 'dart:io';
```

##### B. Remove Machine Field
```dart
// REMOVE this variable
String? _selectedMachine;

// REMOVE machine validation in _submitForm()
// REMOVE machine from formData
// REMOVE machine dropdown from UI
```

##### C. Add Image Upload Variables
```dart
List<File> _selectedImages = [];
final ImagePicker _picker = ImagePicker();
bool _isUploadingImages = false;
```

##### D. Add Image Picker Methods
```dart
Future<void> _pickImagesFromGallery() async {
  try {
    final List<XFile> images = await _picker.pickMultiImage(imageQuality: 80);
    if (images.isNotEmpty) {
      setState(() {
        _selectedImages.addAll(images.map((xFile) => File(xFile.path)));
      });
      _showSuccess('${images.length} gambar ditambahkan');
    }
  } catch (e) {
    _showError('Gagal memilih gambar: $e');
  }
}

Future<void> _takePhoto() async {
  try {
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    if (photo != null) {
      setState(() {
        _selectedImages.add(File(photo.path));
      });
      _showSuccess('Foto ditambahkan');
    }
  } catch (e) {
    _showError('Gagal mengambil foto: $e');
  }
}

void _removeImage(int index) {
  setState(() {
    _selectedImages.removeAt(index);
  });
  _showSuccess('Gambar dihapus');
}

void _showImagePickerOptions() {
  showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (context) => Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.photo_library, color: Color(0xFFDC2626)),
            title: const Text('Pilih dari Galeri'),
            onTap: () {
              Navigator.pop(context);
              _pickImagesFromGallery();
            },
          ),
          ListTile(
            leading: const Icon(Icons.camera_alt, color: Color(0xFFDC2626)),
            title: const Text('Ambil Foto'),
            onTap: () {
              Navigator.pop(context);
              _takePhoto();
            },
          ),
        ],
      ),
    ),
  );
}
```

##### E. Add Image Upload UI
Add this section in the build method after NG Quantity and Reason fields:

```dart
_buildSectionHeader('Foto Bukti (Opsional)', Icons.photo_camera),
Container(
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      ElevatedButton.icon(
        onPressed: _showImagePickerOptions,
        icon: const Icon(Icons.add_photo_alternate),
        label: const Text('Tambah Foto'),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFDC2626),
          foregroundColor: Colors.white,
        ),
      ),
      if (_selectedImages.isNotEmpty) ...[
        const SizedBox(height: 12),
        Text('${_selectedImages.length} foto dipilih'),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: _selectedImages.length,
          itemBuilder: (context, index) {
            return Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    _selectedImages[index],
                    fit: BoxFit.cover,
                    width: double.infinity,
                    height: double.infinity,
                  ),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: GestureDetector(
                    onTap: () => _removeImage(index),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.close,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    ],
  ),
),
```

##### F. Update Submit Form
```dart
Future<void> _submitForm() async {
  // ... validation code ...

  // REMOVE machine validation
  if (_selectedCustomer == null ||
      _selectedCustomerLabel == null ||
      _selectedPoNumber == null ||
      _selectedCustomerPo == null ||
      _selectedSku == null ||
      _selectedSCode == null ||
      _selectedShift == null ||
      _selectedGroup == null ||
      _selectedTime == null ||
      // _selectedMachine == null,  ❌ REMOVE THIS
      _kashift == null ||
      _admin == null) {
    _showError('Lengkapi semua field yang diperlukan');
    return;
  }

  // REMOVE machine from formData
  final formData = {
    'timestamp': _timestamp.toIso8601String(),
    'shift': _selectedShift,
    'group': _selectedGroup,
    'time_slot': _selectedTime,
    // 'machine': _selectedMachine,  ❌ REMOVE THIS
    'kashift': _kashift,
    'admin': _admin,
    'customer': _selectedCustomerLabel,
    'po_number': _selectedPoNumber,
    'customer_po': _selectedCustomerPo,
    'sku': _selectedSku,
    's_code': _selectedSCode,
    'ng_quantity': ngQty,
    'reason': reason,
  };

  setState(() => _isSubmitting = true);
  try {
    final response = await BondingRepository.submitRejectFormInput(formData);
    
    // Upload images if any
    if (_selectedImages.isNotEmpty && response['data'] != null) {
      final bondingRejectId = response['data']['bondingReject']?['id'];
      if (bondingRejectId != null) {
        await _uploadImages(bondingRejectId);
      }
    }
    
    if (mounted) {
      final batchNumber = response['data']?['bondingReject']?['batchNumber'];
      _showSuccess('Data NG berhasil disimpan!\nBatch: $batchNumber');
      Navigator.of(context).pop();
    }
  } catch (e) {
    if (mounted) {
      _showError('Gagal menyimpan data NG');
    }
  } finally {
    if (mounted) {
      setState(() => _isSubmitting = false);
    }
  }
}

Future<void> _uploadImages(String bondingRejectId) async {
  if (_selectedImages.isEmpty) return;
  
  setState(() => _isUploadingImages = true);
  
  try {
    await BondingRepository.uploadImages(bondingRejectId, _selectedImages);
    print('✅ Uploaded ${_selectedImages.length} images');
  } catch (e) {
    print('⚠️ Failed to upload images: $e');
  } finally {
    setState(() => _isUploadingImages = false);
  }
}
```

#### 3. Add Upload Method to Repository

**File:** `smart-production-app/lib/repositories/departments/bonding_repository.dart`

Add this method:

```dart
/// POST - Upload images for bonding reject
/// Endpoint: POST /api/bonding/reject/{id}/upload-images
static Future<Map<String, dynamic>> uploadImages(
  String bondingRejectId,
  List<File> images,
) async {
  print('📤 Uploading ${images.length} images for bonding reject $bondingRejectId');
  
  try {
    final uri = Uri.parse('${HttpClient.baseUrl}/api/bonding/reject/$bondingRejectId/upload-images');
    final request = http.MultipartRequest('POST', uri);
    
    // Add images
    for (var i = 0; i < images.length; i++) {
      final file = images[i];
      request.files.add(
        await http.MultipartFile.fromPath(
          'images',
          file.path,
          filename: 'image_$i${path.extension(file.path)}',
        ),
      );
    }
    
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      print('✅ Images uploaded successfully');
      return json.decode(response.body);
    } else {
      throw Exception('Failed to upload images: ${response.statusCode}');
    }
  } catch (e) {
    print('❌ Upload failed: $e');
    rethrow;
  }
}
```

Don't forget to add imports:
```dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;
import 'dart:convert';
```

---

## 🧪 Testing

### Backend Testing

```bash
# 1. Test without machine (should work)
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

# 2. Test with machine (should also work)
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

# 3. Test image upload
curl -X POST http://localhost:5000/api/bonding/reject/{id}/upload-images \
  -F "images=@test1.jpg" \
  -F "images=@test2.jpg"
```

### Flutter Testing

1. **Run app:**
   ```bash
   cd smart-production-app
   flutter pub get
   flutter run
   ```

2. **Test flow:**
   - Navigate to Bonding → Reject
   - Verify machine field is removed
   - Fill all required fields
   - Click "Tambah Foto"
   - Select multiple images from gallery
   - Take photo with camera
   - Remove an image
   - Submit form
   - Verify success message with batch number
   - Check backend logs for image upload

---

## 📊 API Changes Summary

### Updated Endpoint

**POST /api/bonding/reject/form-input**

**Before:**
```json
{
  "machine": "BND-01"  // Required
}
```

**After:**
```json
{
  "machine": "BND-01"  // Optional (can be omitted)
}
```

### New Endpoint

**POST /api/bonding/reject/:id/upload-images**

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `images`
- Max files: 10
- Allowed types: JPEG, PNG, GIF

**Response:**
```json
{
  "success": true,
  "message": "3 images uploaded successfully",
  "data": {
    "bondingRejectId": "uuid",
    "files": [...]
  }
}
```

---

## ✅ Checklist

### Backend ✅
- [x] DTO updated - machine optional
- [x] Entity updated - machine nullable
- [x] Controller updated - image upload endpoint
- [x] Upload directory created
- [x] File validation added

### Flutter ⚠️ (Manual Update Required)
- [ ] Add image_picker dependency
- [ ] Remove machine field variable
- [ ] Remove machine validation
- [ ] Remove machine from formData
- [ ] Remove machine dropdown UI
- [ ] Add image picker variables
- [ ] Add image picker methods
- [ ] Add image upload UI
- [ ] Update submit form
- [ ] Add upload images method
- [ ] Add repository upload method

---

## 🎯 Summary

### What Changed:

1. **Backend:**
   - ✅ Machine field is now optional
   - ✅ New image upload endpoint
   - ✅ File validation and storage

2. **Flutter:**
   - ⚠️ Need to remove machine field
   - ⚠️ Need to add image upload feature
   - ⚠️ Need to update repository

### Benefits:

- ✅ Simpler form (no machine required)
- ✅ Evidence photos support
- ✅ Multiple image upload
- ✅ Camera and gallery support
- ✅ Image preview and removal

---

**Status:** Backend ✅ Complete | Flutter ⚠️ Manual Update Required  
**Last Updated:** January 9, 2025
