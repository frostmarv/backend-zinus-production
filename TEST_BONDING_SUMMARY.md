# Test Bonding Summary Endpoint

## Endpoint
`POST /bonding/summary/form-input`

## Request Body (JSON)

```json
{
  "timestamp": "2025-01-07T15:00:00.000Z",
  "shift": "1",
  "group": "A",
  "time_slot": "08.00 - 09.00",
  "machine": "Machine-1",
  "kashift": "Noval",
  "admin": "Aline",
  "customer": "WMT US STORE",
  "po_number": "0879611929",
  "customer_po": "0879611929",
  "sku": "SPT-STR-800F",
  "quantity_produksi": 100
}
```

## Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `timestamp` | string (ISO8601) | ✅ | Waktu input data | "2025-01-07T15:00:00.000Z" |
| `shift` | string | ✅ | Shift kerja (1 atau 2) | "1" |
| `group` | string | ✅ | Group kerja (A atau B) | "A" |
| `time_slot` | string | ✅ | Slot waktu kerja | "08.00 - 09.00" |
| `machine` | string | ✅ | Nama mesin | "Machine-1" |
| `kashift` | string | ✅ | Nama kepala shift | "Noval" atau "Abizar" |
| `admin` | string | ✅ | Nama admin | "Aline" atau "Puji" |
| `customer` | string | ✅ | Nama customer | "WMT US STORE" |
| `po_number` | string | ✅ | Nomor PO | "0879611929" |
| `customer_po` | string | ✅ | Customer PO | "0879611929" |
| `sku` | string | ✅ | SKU produk | "SPT-STR-800F" |
| `quantity_produksi` | number | ✅ | Jumlah produksi (min: 1) | 100 |

## Kashift & Admin Mapping

Berdasarkan Group:
- **Group A**: Kashift = "Noval", Admin = "Aline"
- **Group B**: Kashift = "Abizar", Admin = "Puji"

## Expected Response

### Success (201 Created)
```json
{
  "success": true,
  "message": "Bonding summary created successfully",
  "data": {
    "id": 1,
    "timestamp": "2025-01-07T15:00:00.000Z",
    "shift": "1",
    "group": "A",
    "timeSlot": "08.00 - 09.00",
    "machine": "Machine-1",
    "kashift": "Noval",
    "admin": "Aline",
    "customer": "WMT US STORE",
    "poNumber": "0879611929",
    "customerPo": "0879611929",
    "sku": "SPT-STR-800F",
    "quantityProduksi": 100,
    "createdAt": "2025-01-07T15:00:00.000Z",
    "updatedAt": "2025-01-07T15:00:00.000Z"
  }
}
```

### Error (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": [
    "timestamp must be a valid ISO 8601 date string",
    "shift should not be empty",
    "quantity_produksi must not be less than 1"
  ],
  "error": "Bad Request"
}
```

## Test dengan cURL

```bash
curl -X POST http://localhost:5000/bonding/summary/form-input \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-01-07T15:00:00.000Z",
    "shift": "1",
    "group": "A",
    "time_slot": "08.00 - 09.00",
    "machine": "Machine-1",
    "kashift": "Noval",
    "admin": "Aline",
    "customer": "WMT US STORE",
    "po_number": "0879611929",
    "customer_po": "0879611929",
    "sku": "SPT-STR-800F",
    "quantity_produksi": 100
  }'
```

## Test dengan Postman

1. Method: `POST`
2. URL: `http://localhost:5000/bonding/summary/form-input`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON): Copy JSON dari contoh di atas

## Database Schema

Dengan TypeORM `synchronize: true`, tabel akan otomatis dibuat dengan struktur:

```sql
CREATE TABLE bonding_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    shift VARCHAR(10) NOT NULL,
    "group" VARCHAR(10) NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    machine VARCHAR(50) NOT NULL,
    kashift VARCHAR(100) NOT NULL,
    admin VARCHAR(100) NOT NULL,
    customer VARCHAR(100) NOT NULL,
    po_number VARCHAR(100) NOT NULL,
    customer_po VARCHAR(100) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    quantity_produksi INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_bonding_summary_customer ON bonding_summary(customer);
CREATE INDEX idx_bonding_summary_po_number ON bonding_summary(po_number);
CREATE INDEX idx_bonding_summary_sku ON bonding_summary(sku);
CREATE INDEX idx_bonding_summary_created_at ON bonding_summary(created_at);
```

## Notes

- ✅ TypeORM synchronize akan otomatis membuat/update tabel saat server start
- ✅ Tidak perlu migration manual
- ✅ Validasi otomatis menggunakan class-validator
- ✅ Field mapping dari snake_case (DTO) ke camelCase (Entity) sudah ditangani di service
