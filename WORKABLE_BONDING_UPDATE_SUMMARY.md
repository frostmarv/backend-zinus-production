# ✅ Workable Bonding - NG Integration Complete

## 🎉 Summary

View `v_workable_bonding` dan `v_workable_bonding_detail` sekarang terintegrasi dengan sistem NG dan replacement!

---

## 📊 New Columns

### Added to Both Views:

| Column | Description |
|--------|-------------|
| **ng** | Total NG/reject dari bonding |
| **replacement** | Total replacement yang sudah diproses cutting |
| **ng_active** | NG yang belum diganti (ng - replacement) |

### Updated Column:

| Column | Old Formula | New Formula |
|--------|-------------|-------------|
| **remain** | `workable - bonding` | `workable - bonding - ng_active` |

---

## 🔄 How It Works

### Logic Flow:

```
1. Workable = Material dari cutting (min of all layers)
   
2. Bonding = Total produksi bonding
   
3. NG = Total reject dari bonding
   
4. Replacement = Total yang sudah diganti oleh cutting
   
5. NG Active = NG - Replacement (NG yang belum diganti)
   
6. Remain = Workable - Bonding - NG Active
```

---

## 📈 Example

### Scenario: NG dengan Partial Replacement

```
Order: 1000 units
Workable: 800 (from cutting)
Bonding: 500 (produced)
NG: 50 (reject)
Replacement: 30 (processed by cutting)
NG Active: 20 (50 - 30)
Remain: 280 (800 - 500 - 20)
```

**Interpretation:**
- Cutting produced 800 units
- Bonding completed 500 units
- 50 units NG detected
- 30 units already replaced
- 20 units NG still active
- **Only 280 units remaining** (workable reduced by active NG)

---

## 🔍 Query Examples

### Get All with NG Info

```sql
SELECT 
  shipToName,
  sku,
  workable,
  bonding,
  ng,
  replacement,
  ng_active,
  remain
FROM v_workable_bonding
WHERE ng > 0;
```

### Get Active NG (Not Yet Replaced)

```sql
SELECT 
  shipToName,
  sku,
  ng,
  replacement,
  ng_active,
  remain
FROM v_workable_bonding
WHERE ng_active > 0
ORDER BY ng_active DESC;
```

---

## 🧪 Testing

### Apply View Changes

```bash
# SQLite
sqlite3 dev.sqlite < setup_views.sql

# PostgreSQL
psql -U postgres -d zinus_production -f setup_views.sql
```

### Test Query

```sql
-- Check view structure
SELECT * FROM v_workable_bonding LIMIT 1;

-- Should show columns:
-- week, shipToName, sku, quantityOrder, workable, bonding, 
-- ng, replacement, ng_active, remain, remarks, status
```

---

## 📊 API Response

### GET /api/workable-bonding

**Before:**
```json
{
  "workable": 800,
  "bonding": 500,
  "remain": 300
}
```

**After:**
```json
{
  "workable": 800,
  "bonding": 500,
  "ng": 50,
  "replacement": 30,
  "ng_active": 20,
  "remain": 280
}
```

---

## ✅ Benefits

### 1. Real-time NG Tracking
- See total NG per SKU
- Track replacement progress
- Monitor active NG

### 2. Accurate Remain Calculation
- Workable reduced by active NG
- Auto-adjustment when replacement processed
- Prevents over-production

### 3. Complete Visibility
- All metrics in one view
- NG lifecycle tracking
- Replacement status monitoring

---

## 🔄 Integration

### Tables Involved:

1. **bonding_reject** - NG data
2. **replacement_progress** - Replacement tracking
3. **bonding_summary** - Production data
4. **production_cutting_entries** - Cutting data

### Automatic Updates:

- ✅ NG added → workable reduced
- ✅ Replacement processed → NG active reduced
- ✅ Replacement completed → remain restored

---

## 📝 Files Modified

1. ✅ `setup_views.sql` - Updated both views
2. ✅ `WORKABLE_BONDING_NG_INTEGRATION.md` - Complete documentation

---

## 🎯 Next Steps

1. **Apply view changes:**
   ```bash
   sqlite3 dev.sqlite < setup_views.sql
   ```

2. **Test API:**
   ```bash
   GET /api/workable-bonding
   ```

3. **Verify columns:**
   - ng
   - replacement
   - ng_active
   - remain (updated formula)

4. **Test workflow:**
   - Create NG
   - Process replacement
   - Check remain updates

---

**Status:** ✅ Complete & Ready  
**Views Updated:** `v_workable_bonding`, `v_workable_bonding_detail`  
**New Columns:** ng, replacement, ng_active  
**Updated Formula:** remain = workable - bonding - ng_active

🎉 **Workable now accounts for NG and replacement!**
