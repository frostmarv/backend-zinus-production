# Workable Bonding Views - Update Summary

## 🎯 Changes Overview

### Before:
```
Week | ShipToName | SKU | Qty Order | Progress | Remain | Remarks | Status
```
- `progress` = hasil cutting (MIN dari layers)
- `remain` = quantityOrder - progress

### After:
```
Week | ShipToName | SKU | Qty Order | Workable | Bonding | Remain | Remarks | Status
```
- `workable` = hasil cutting (MIN dari layers) - **material siap bonding**
- `bonding` = total produksi bonding - **yang sudah dikerjakan**
- `remain` = quantityOrder - bonding - **sisa yang belum selesai**

## 📊 Flow

```
┌─────────┐      ┌──────────┐      ┌─────────┐      ┌────────┐
│ Order   │  →   │ Cutting  │  →   │ Bonding │  →   │ Remain │
│ 1560    │      │ (layers) │      │         │      │        │
└─────────┘      └──────────┘      └─────────┘      └────────┘
                      ↓                  ↓               ↓
                  Workable           Bonding         Remain
                   1560                450            1110
```

## 🔄 Logic Changes

### Workable Calculation:
```sql
-- Workable = MIN dari semua layers cutting
workable = MIN(Layer1, Layer2, Layer3, Layer4, Hole)
```

### Bonding Calculation:
```sql
-- Bonding = SUM dari bonding_summary
bonding = SUM(bonding_summary.quantity_produksi)
WHERE customer_po = X AND sku = Y
```

### Remain Calculation:
```sql
-- BEFORE: remain = quantityOrder - workable
-- AFTER:  remain = quantityOrder - bonding ✅
remain = quantityOrder - bonding
```

## 📋 Response Columns

### Endpoint 1: GET /workable-bonding

| Column | Before | After | Description |
|--------|--------|-------|-------------|
| week | ✅ | ✅ | Week number |
| shipToName | ✅ | ✅ | Customer name |
| sku | ✅ | ✅ | Product SKU |
| quantityOrder | ✅ | ✅ | Total order |
| ~~progress~~ | ✅ | ❌ | **REMOVED** |
| **workable** | ❌ | ✅ | **NEW**: Hasil cutting (siap bonding) |
| **bonding** | ❌ | ✅ | **NEW**: Total produksi bonding |
| remain | ✅ | ✅ | **UPDATED**: order - bonding |
| remarks | ✅ | ✅ | Status description |
| status | ✅ | ✅ | Status code |

### Endpoint 2: GET /workable-bonding/detail

| Column | Before | After | Description |
|--------|--------|-------|-------------|
| customerPO | ✅ | ✅ | Customer PO |
| shipToName | ✅ | ✅ | Customer name |
| sku | ✅ | ✅ | Product SKU |
| week | ✅ | ✅ | Week number |
| quantityOrder | ✅ | ✅ | Total order |
| Layer 1 | ✅ | ✅ | Layer 1 cutting |
| Layer 2 | ✅ | ✅ | Layer 2 cutting |
| Layer 3 | ✅ | ✅ | Layer 3 cutting |
| Layer 4 | ✅ | ✅ | Layer 4 cutting |
| Hole | ✅ | ✅ | Hole cutting |
| **workable** | ❌ | ✅ | **NEW**: MIN(all layers) |
| **bonding** | ❌ | ✅ | **NEW**: Total bonding |
| remain | ✅ | ✅ | **UPDATED**: order - bonding |
| remarks | ✅ | ✅ | Status description |
| status | ✅ | ✅ | Status code |

## 🎭 Status Changes

### Before:
- **"Workable"**: progress >= quantityOrder
- **"Running"**: progress > 0
- **"Not Started"**: progress = 0

### After:
- **"Completed"**: bonding >= quantityOrder ✅ **NEW**
- **"Workable"**: workable >= quantityOrder
- **"Running"**: workable > 0
- **"Not Started"**: workable = 0

### Remarks Changes:

| Status | Before | After |
|--------|--------|-------|
| Completed | - | **"Bonding completed"** ✅ NEW |
| Workable | "Ready for bonding" | "Ready for bonding" |
| Running | "In progress" | **"Cutting in progress"** |
| Not Started | "Waiting for cutting" | "Waiting for cutting" |

## 📝 Example Responses

### Before:
```json
{
  "week": 1,
  "shipToName": "WMT US STORE",
  "sku": "SPT-STR-800F",
  "quantityOrder": 1560,
  "progress": 1560,
  "remain": 0,
  "remarks": "Ready for bonding",
  "status": "Workable"
}
```

### After:
```json
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
}
```

## 🔧 How to Update

### 1. Update Views (Required)

**SQLite (Development):**
```bash
cd backend-zinus-production
sqlite3 dev.sqlite < update_workable_bonding_views.sql
```

**PostgreSQL (Production):**
```bash
psql $DATABASE_URL -f update_workable_bonding_views.sql
```

### 2. Restart Server (Optional)
```bash
npm run start:dev
```

### 3. Test Endpoints
```bash
# Test workable-bonding
curl http://localhost:5000/workable-bonding

# Test workable-bonding/detail
curl http://localhost:5000/workable-bonding/detail
```

## 🎬 Scenarios

### Scenario 1: Cutting Selesai, Bonding Belum Mulai
```json
{
  "quantityOrder": 1560,
  "workable": 1560,    // ✅ Cutting selesai
  "bonding": 0,        // ⏳ Bonding belum mulai
  "remain": 1560,      // 📦 Semua masih tersisa
  "status": "Workable",
  "remarks": "Ready for bonding"
}
```

### Scenario 2: Bonding Sedang Berjalan
```json
{
  "quantityOrder": 1560,
  "workable": 1560,    // ✅ Cutting selesai
  "bonding": 450,      // 🔄 Bonding 450 pcs
  "remain": 1110,      // 📦 Sisa 1110 pcs
  "status": "Workable",
  "remarks": "Ready for bonding"
}
```

### Scenario 3: Bonding Selesai
```json
{
  "quantityOrder": 1560,
  "workable": 1560,    // ✅ Cutting selesai
  "bonding": 1560,     // ✅ Bonding selesai
  "remain": 0,         // 🎉 Tidak ada sisa
  "status": "Completed",
  "remarks": "Bonding completed"
}
```

### Scenario 4: Cutting Masih Berjalan
```json
{
  "quantityOrder": 1560,
  "workable": 450,     // 🔄 Cutting baru 450 pcs
  "bonding": 0,        // ⏸️ Bonding belum bisa mulai
  "remain": 1560,      // 📦 Semua masih tersisa
  "status": "Running",
  "remarks": "Cutting in progress"
}
```

## 🎯 Benefits

### For Production Team:
- ✅ Clear visibility: berapa yang siap bonding vs sudah bonding
- ✅ Accurate remain: sisa yang benar-benar belum selesai
- ✅ Better planning: tahu kapan bisa mulai bonding

### For Management:
- ✅ Real-time tracking: progress bonding live
- ✅ Bottleneck identification: lihat mana yang lambat
- ✅ Accurate reporting: data akurat untuk decision making

### For System:
- ✅ Scalable: mudah ditambahkan department lain
- ✅ Consistent: logic sama untuk semua department
- ✅ Maintainable: single source of truth

## 🔍 Technical Details

### View Dependencies:
```
production_order_items
    ↓
production_orders → customers
    ↓
products → assembly_layers
    ↓
production_cutting_entries (cutting data)
    ↓
bonding_summary (bonding data) ✅ NEW
    ↓
v_workable_bonding
v_workable_bonding_detail
```

### Query Performance:
- Indexed on: customer_po, sku
- Aggregation: SUM, MIN
- Join: LEFT JOIN (to include orders without bonding)

## 📚 Related Documentation

- `test-workable-bonding.md` - API response details
- `update_workable_bonding_views.sql` - SQL script
- `setup_views.sql` - Complete views definition
- `BONDING_COMPLETE_SUMMARY.md` - Bonding implementation

## ✅ Checklist

### Backend:
- [x] Update v_workable_bonding view
- [x] Update v_workable_bonding_detail view
- [x] Create update script
- [x] Documentation complete

### Database:
- [ ] Run update script on development
- [ ] Test queries
- [ ] Run update script on production
- [ ] Verify data

### Frontend:
- [ ] Update API response handling
- [ ] Update UI to show workable + bonding columns
- [ ] Test integration
- [ ] Update documentation

---

**Status**: ✅ **READY TO DEPLOY**

Last Updated: 2025-01-07
