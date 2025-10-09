# Google Drive Integration Setup Guide

## Overview
This implementation provides automatic document upload to Google Drive with:
- Auto-generated document control numbers (format: `ZDI/{dept}/{type}/{YYYYMM}-{shift}/{group}`)
- Automatic folder structure creation (category/year/month)
- Multi-file upload support
- Temporary local storage with automatic cleanup

## Installation

### 1. Install Dependencies
```bash
npm install multer @types/multer uuid dayjs
```

Note: `googleapis` is already installed in the project.

### 2. Google Cloud Console Setup

#### Create Service Account:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Go to "IAM & Admin" > "Service Accounts"
5. Click "Create Service Account"
6. Give it a name (e.g., "drive-uploader")
7. Grant role: "Editor" or custom role with Drive permissions
8. Click "Create Key" > JSON format
9. Download the JSON file

#### Configure Google Drive:
1. Open Google Drive
2. Create or select the root folder for uploads
3. Right-click > Share
4. Add the service account email (from JSON file: `client_email`)
5. Give "Editor" permissions
6. Copy the folder ID from URL (e.g., `https://drive.google.com/drive/folders/{FOLDER_ID}`)

### 3. Add Credentials File
1. Rename downloaded JSON to `drive-credentials.json`
2. Place it in: `src/config/drive-credentials.json`
3. Add to `.gitignore`:
   ```
   src/config/drive-credentials.json
   ```

## File Structure

```
src/
├── config/
│   ├── googleDrive.config.ts       # Google Drive authentication
│   └── drive-credentials.json      # Service account credentials (DO NOT COMMIT)
├── services/
│   └── google-drive.service.ts     # Upload & folder management
├── routes/
│   └── document.controller.ts      # API endpoint
├── utils/
│   └── document-control.util.ts    # Document number generator
└── uploads/                         # Temporary file storage
```

## API Usage

### Endpoint
```
POST /documents/upload
```

### Request Format
- Content-Type: `multipart/form-data`
- Max files: 10

### Parameters

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| files | File[] | Yes | Files to upload | Multiple files |
| deptCode | string | Yes | Department code | "PROD" |
| docType | string | Yes | Document type | "QC" |
| shift | string | Yes | Shift identifier | "A" |
| groupCode | string | Yes | Group code | "G1" |
| category | string | Yes | Category folder | "NG" or "PROD" |

### Example Request (cURL)
```bash
curl -X POST http://localhost:3000/documents/upload \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.jpg" \
  -F "deptCode=PROD" \
  -F "docType=QC" \
  -F "shift=A" \
  -F "groupCode=G1" \
  -F "category=NG"
```

### Example Request (JavaScript/Fetch)
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('deptCode', 'PROD');
formData.append('docType', 'QC');
formData.append('shift', 'A');
formData.append('groupCode', 'G1');
formData.append('category', 'NG');

const response = await fetch('http://localhost:3000/documents/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

### Response Format
```json
{
  "message": "Upload success",
  "documentNumber": "ZDI/PROD/QC/202501-A/G1",
  "uploaded": [
    {
      "docNumber": "ZDI/PROD/QC/202501-A/G1",
      "fileName": "file1.pdf",
      "driveLink": "https://drive.google.com/file/d/..."
    },
    {
      "docNumber": "ZDI/PROD/QC/202501-A/G1",
      "fileName": "file2.jpg",
      "driveLink": "https://drive.google.com/file/d/..."
    }
  ]
}
```

## Document Number Format

Format: `ZDI/{deptCode}/{docType}/{YYYYMM}-{shift}/{groupCode}`

Example: `ZDI/PROD/QC/202501-A/G1`
- ZDI: Company prefix
- PROD: Department code
- QC: Document type
- 202501: Year and month (auto-generated)
- A: Shift
- G1: Group code

## Folder Structure in Google Drive

```
Root Folder (shared with service account)
└── {category} (e.g., "NG" or "PROD")
    └── {year} (e.g., "2025")
        └── {month} (e.g., "01")
            └── uploaded files
```

Example:
```
Root
└── NG
    └── 2025
        └── 01
            ├── file1.pdf
            └── file2.jpg
```

## Features

### ✅ Automatic Folder Creation
- Creates category/year/month structure automatically
- No manual folder management needed
- Folders are created on-demand

### ✅ Document Control Number
- Auto-generated based on parameters
- Consistent format across all documents
- Includes timestamp (YYYYMM)

### ✅ Multi-File Upload
- Upload up to 10 files per request
- All files get same document number
- Individual Drive links returned

### ✅ Automatic Cleanup
- Files stored temporarily in `./uploads`
- Deleted after successful upload to Drive
- No manual cleanup needed

## Security Notes

⚠️ **IMPORTANT:**
1. Never commit `drive-credentials.json` to version control
2. Add to `.gitignore` immediately
3. Use environment variables for folder IDs in production
4. Restrict service account permissions to minimum required
5. Regularly rotate service account keys

## Troubleshooting

### Error: "Cannot find module 'drive-credentials.json'"
- Ensure file exists at `src/config/drive-credentials.json`
- Check file permissions

### Error: "Insufficient permissions"
- Verify service account email has access to target folder
- Check folder sharing settings in Google Drive
- Ensure Google Drive API is enabled

### Error: "File not found" after upload
- Check if service account has write permissions
- Verify folder ID is correct
- Check Google Drive API quota

### Files not being deleted locally
- Check file system permissions on `./uploads` directory
- Verify path in multer configuration

## Environment Variables (Optional)

For production, consider using environment variables:

```env
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_folder_id_here
GOOGLE_DRIVE_CREDENTIALS_PATH=/path/to/credentials.json
```

Update `googleDrive.config.ts`:
```typescript
const CREDENTIALS_PATH = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || 
                         path.join(__dirname, 'drive-credentials.json');
```

## Testing

Test the endpoint:
```bash
# Create test file
echo "Test content" > test.txt

# Upload
curl -X POST http://localhost:3000/documents/upload \
  -F "files=@test.txt" \
  -F "deptCode=TEST" \
  -F "docType=DEMO" \
  -F "shift=A" \
  -F "groupCode=G1" \
  -F "category=TEST"
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Create service account and download credentials
3. ✅ Place credentials file in `src/config/`
4. ✅ Share Google Drive folder with service account
5. ✅ Test the upload endpoint
6. ✅ Integrate with your frontend application

## Support

For issues or questions:
- Check Google Drive API documentation
- Verify service account permissions
- Review application logs for detailed error messages
