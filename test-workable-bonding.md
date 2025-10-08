# API Workable Bonding - Response Columns (UPDATED)

## Endpoint 1: GET /workable-bonding

### Response Columns (dari view v_workable_bonding):

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `week` | number | Week number | 1 |
| `shipToName` | string | Customer name | "WMT US STORE" |
| `sku` | string | Product SKU | "SPT-STR-800F" |
| `quantityOrder` | number | Total order quantity | 1560 |
| `workable` | number | ✅ **BARU**: Min actual qty dari cutting (siap bonding) | 1560 |
| `bonding` | number | ✅ **BARU**: Total yang sudah diproduksi di bonding | 450 |
| `remain` | number | ✅ **UPDATED**: quantityOrder - bonding | 1110 |
| `remarks` | string | Status description | "Bonding completed" / "Ready for bonding" / "Cutting in progress" / "Waiting for cutting" |
| `status` | string | Status code | "Completed" / "Workable" / "Running" / "Not Started" |

### Example Response:
```json
[
  {
    "week": 1,
    "shipToName": "WMT US STORE",
    "sku": "SPT-STR-800F",
    "quantityOrder": 1560,
    "workable": 1560,
    "bonding": 450,
    "remain": 1110,
    "remarks": "Ready for bonding",
    "status": "Workable"
  },
  {
    "week": 1,
    "shipToName": "AMAZON DI",
    "sku": "AZ-CMM-1000F",
    "quantityOrder": 117,
    "workable": 117,
    "bonding": 117,
    "remain": 0,
    "remarks": "Bonding completed",
    "status": "Completed"
  }
]
```

## Endpoint 2: GET /workable-bonding/detail

### Response Columns (dari view v_workable_bonding_detail):

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `customerPO` | string | Customer PO number | "0879611929" |
| `shipToName` | string | Customer name | "WMT US STORE" |
| `sku` | string | Product SKU | "SPT-STR-800F" |
| `week` | number | Week number | 1 |
| `quantityOrder` | number | Total order quantity | 1560 |
| `Layer 1` | number | Actual qty for layer 1 from cutting | 1560 |
| `Layer 2` | number | Actual qty for layer 2 from cutting | 1560 |
| `Layer 3` | number | Actual qty for layer 3 from cutting | 0 |
| `Layer 4` | number | Actual qty for layer 4 from cutting | 0 |
| `Hole` | number | Actual qty for hole (layer 5) from cutting | 0 |
| `workable` | number | ✅ **BARU**: Min(all layers) - siap bonding | 1560 |
| `bonding` | number | ✅ **BARU**: Total yang sudah diproduksi di bonding | 450 |
| `remain` | number | ✅ **UPDATED**: quantityOrder - bonding | 1110 |
| `remarks` | string | Status description | "Bonding completed" / "Ready for bonding" / "Cutting in progress" / "Waiting for cutting" |
| `status` | string | Status code | "Completed" / "Workable" / "Running" / "Not Started" |

### Example Response:
```json
[
  {
    "customerPO": "0879611929",
    "shipToName": "WMT US STORE",
    "sku": "SPT-STR-800F",
    "week": 1,
    "quantityOrder": 1560,
    "Layer 1": 1560,
    "Layer 2": 1560,
    "Layer 3": 0,
    "Layer 4": 0,
    "Hole": 0,
    "workable": 1560,
    "bonding": 450,
    "remain": 1110,
    "remarks": "Ready for bonding",
    "status": "Workable"
  }
]
```

## Logic (UPDATED)

### Flow:
```
Cutting → Workable → Bonding → Remain
```

### Calculation:
- **workable** = MIN(actual_qty dari semua layers cutting) - Material yang siap untuk bonding
- **bonding** = SUM(quantity_produksi dari bonding_summary) - Total yang sudah diproduksi
- **remain** = quantityOrder - bonding - Sisa yang belum selesai bonding

### Status Logic:
- **"Completed"**: bonding >= quantityOrder (bonding sudah selesai)
- **"Workable"**: workable >= quantityOrder (siap untuk bonding, cutting selesai)
- **"Running"**: workable > 0 (cutting masih berjalan)
- **"Not Started"**: workable = 0 (belum ada produksi cutting)

### Remarks:
- **"Bonding completed"**: Status = Completed
- **"Ready for bonding"**: Status = Workable
- **"Cutting in progress"**: Status = Running
- **"Waiting for cutting"**: Status = Not Started

### Key Changes:
- ✅ **workable** berkurang mengikuti produksi bonding (tidak langsung, tapi bonding yang bertambah)
- ✅ **remain** sekarang = order - bonding (bukan order - workable)
- ✅ Status "Completed" ditambahkan untuk bonding yang sudah selesai

## Filter

- **FOAM products only** (SPRING excluded)
- Only orders with `week_number IS NOT NULL`
- Sorted by `shipToName`, `sku` (case-insensitive)

## Use Case

**Workable Bonding** digunakan untuk:
1. Melihat order mana yang sudah siap untuk proses bonding
2. Tracking progress cutting per SKU
3. Identifikasi bottleneck (layer mana yang paling lambat)
4. Planning produksi bonding berdasarkan ketersediaan material
5. ✅ **BARU**: Monitoring progress bonding real-time
6. ✅ **BARU**: Tracking remain quantity yang akurat

## How to Update Views

### SQLite (Development):
```bash
cd backend-zinus-production
sqlite3 dev.sqlite < update_workable_bonding_views.sql
```

### PostgreSQL (Production):
```bash
psql $DATABASE_URL -f update_workable_bonding_views.sql
```

### Using TypeORM (Alternative):
Views akan otomatis di-recreate saat server start jika menggunakan TypeORM migrations atau setup script.

## Example Scenarios

### Scenario 1: Cutting Selesai, Bonding Belum Mulai
```json
{
  "quantityOrder": 1560,
  "workable": 1560,    // Cutting selesai
  "bonding": 0,        // Bonding belum mulai
  "remain": 1560,      // Semua masih tersisa
  "status": "Workable",
  "remarks": "Ready for bonding"
}
```

### Scenario 2: Bonding Sedang Berjalan
```json
{
  "quantityOrder": 1560,
  "workable": 1560,    // Cutting selesai
  "bonding": 450,      // Bonding 450 pcs
  "remain": 1110,      // Sisa 1110 pcs
  "status": "Workable",
  "remarks": "Ready for bonding"
}
```

### Scenario 3: Bonding Selesai
```json
{
  "quantityOrder": 1560,
  "workable": 1560,    // Cutting selesai
  "bonding": 1560,     // Bonding selesai
  "remain": 0,         // Tidak ada sisa
  "status": "Completed",
  "remarks": "Bonding completed"
}
```

### Scenario 4: Cutting Masih Berjalan
```json
{
  "quantityOrder": 1560,
  "workable": 450,     // Cutting baru 450 pcs
  "bonding": 0,        // Bonding belum bisa mulai
  "remain": 1560,      // Semua masih tersisa
  "status": "Running",
  "remarks": "Cutting in progress"
}
```

