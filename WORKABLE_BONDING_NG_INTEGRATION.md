# Workable Bonding - NG Integration

## 🎯 Overview

View `v_workable_bonding` dan `v_workable_bonding_detail` sekarang terintegrasi dengan sistem NG (reject) dan replacement.

---

## 📊 New Columns

### v_workable_bonding

| Column | Type | Description |
|--------|------|-------------|
| week | VARCHAR | Week number |
| shipToName | VARCHAR | Customer name |
| sku | VARCHAR | Product SKU |
| quantityOrder | INTEGER | Total order quantity |
| workable | INTEGER | Available material from cutting (min of all layers) |
| bonding | INTEGER | Total produced in bonding |
| **ng** | **INTEGER** | **Total NG/reject from bonding** |
| **replacement** | **INTEGER** | **Total replacement processed by cutting** |
| **ng_active** | **INTEGER** | **Active NG (ng - replacement)** |
| remain | INTEGER | **Remaining workable (workable - bonding - ng_active)** |
| remarks | VARCHAR | Status remarks |
| status | VARCHAR | Overall status |

### v_workable_bonding_detail

| Column | Type | Description |
|--------|------|-------------|
| customerPO | VARCHAR | Customer PO |
| shipToName | VARCHAR | Customer name |
| sku | VARCHAR | Product SKU |
| week | VARCHAR | Week number |
| quantityOrder | INTEGER | Total order quantity |
| Layer 1 | INTEGER | Layer 1 cutting quantity |
| Layer 2 | INTEGER | Layer 2 cutting quantity |
| Layer 3 | INTEGER | Layer 3 cutting quantity |
| Layer 4 | INTEGER | Layer 4 cutting quantity |
| Hole | INTEGER | Hole cutting quantity |
| workable | INTEGER | Minimum of all layers |
| bonding | INTEGER | Total bonding production |
| **ng** | **INTEGER** | **Total NG/reject** |
| **replacement** | **INTEGER** | **Total replacement processed** |
| **ng_active** | **INTEGER** | **Active NG (ng - replacement)** |
| remain | INTEGER | **Remaining (workable - bonding - ng_active)** |
| status | VARCHAR | Overall status |
| remarks | VARCHAR | Status remarks |

---

## 🔄 Logic Flow

### 1. NG (Reject) Calculation

```sql
ng_totals AS (
  SELECT 
    br.customer_po AS customerPO,
    br.sku,
    SUM(br.ng_quantity) AS ng_qty
  FROM bonding_reject br
  WHERE br.status != 'CANCELLED'
  GROUP BY br.customer_po, br.sku
)
```

**What it does:**
- Sum all NG quantities from `bonding_reject` table
- Exclude cancelled records
- Group by customer PO and SKU

### 2. Replacement Calculation

```sql
replacement_totals AS (
  SELECT 
    br.customer_po AS customerPO,
    br.sku,
    SUM(COALESCE(rp.processed_qty, 0)) AS replacement_qty
  FROM bonding_reject br
  LEFT JOIN replacement_progress rp ON br.id = rp.bonding_reject_id
  WHERE br.status != 'CANCELLED'
    AND rp.status IN ('IN_PROGRESS', 'COMPLETED')
  GROUP BY br.customer_po, br.sku
)
```

**What it does:**
- Sum all processed replacement quantities
- Join `bonding_reject` with `replacement_progress`
- Only count IN_PROGRESS and COMPLETED replacements
- Exclude cancelled records

### 3. NG Active Calculation

```sql
ng_active = ng - replacement
```

**What it means:**
- **ng_active** = NG yang belum diganti
- If replacement > 0, NG berkurang
- If replacement = ng, ng_active = 0 (all NG replaced)

### 4. Remain Calculation

```sql
remain = workable - bonding - ng_active
```

**What it means:**
- **workable** = Material available from cutting
- **bonding** = Already produced in bonding
- **ng_active** = NG that hasn't been replaced yet
- **remain** = Material yang masih bisa dikerjakan bonding

---

## 📈 Example Scenarios

### Scenario 1: No NG

```
quantityOrder: 1000
workable: 800 (from cutting)
bonding: 500
ng: 0
replacement: 0
ng_active: 0
remain: 300 (800 - 500 - 0)
```

**Interpretation:**
- Cutting produced 800 units
- Bonding completed 500 units
- No NG/reject
- 300 units remaining to be bonded

### Scenario 2: NG Without Replacement

```
quantityOrder: 1000
workable: 800
bonding: 500
ng: 50
replacement: 0
ng_active: 50 (50 - 0)
remain: 250 (800 - 500 - 50)
```

**Interpretation:**
- Cutting produced 800 units
- Bonding completed 500 units
- 50 units NG (defect)
- No replacement yet
- Only 250 units remaining (workable reduced by NG)

### Scenario 3: NG With Partial Replacement

```
quantityOrder: 1000
workable: 800
bonding: 500
ng: 50
replacement: 30
ng_active: 20 (50 - 30)
remain: 280 (800 - 500 - 20)
```

**Interpretation:**
- Cutting produced 800 units
- Bonding completed 500 units
- 50 units NG
- 30 units already replaced by cutting
- 20 units NG still active (not replaced)
- 280 units remaining (workable reduced by active NG only)

### Scenario 4: NG Fully Replaced

```
quantityOrder: 1000
workable: 800
bonding: 500
ng: 50
replacement: 50
ng_active: 0 (50 - 50)
remain: 300 (800 - 500 - 0)
```

**Interpretation:**
- Cutting produced 800 units
- Bonding completed 500 units
- 50 units NG
- All 50 units replaced by cutting
- No active NG
- 300 units remaining (back to normal)

---

## 🔍 Query Examples

### Get All Workable with NG Info

```sql
SELECT 
  week,
  shipToName,
  sku,
  quantityOrder,
  workable,
  bonding,
  ng,
  replacement,
  ng_active,
  remain,
  status
FROM v_workable_bonding
WHERE ng > 0
ORDER BY ng_active DESC;
```

### Get SKUs with Active NG

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

### Get Completed Replacements

```sql
SELECT 
  shipToName,
  sku,
  ng,
  replacement,
  ng_active
FROM v_workable_bonding
WHERE ng > 0 AND ng_active = 0
ORDER BY ng DESC;
```

### Get Workable Detail with NG

```sql
SELECT 
  customerPO,
  shipToName,
  sku,
  "Layer 1",
  "Layer 2",
  "Layer 3",
  "Layer 4",
  "Hole",
  workable,
  bonding,
  ng,
  replacement,
  ng_active,
  remain
FROM v_workable_bonding_detail
WHERE ng > 0;
```

---

## 🔄 Integration with Workflow

### Complete Flow

```
1. Cutting produces material
   ↓
   workable = min(all layers)
   
2. Bonding produces units
   ↓
   bonding += quantity
   remain = workable - bonding
   
3. NG detected in bonding
   ↓
   ng += ng_quantity
   ng_active = ng - replacement
   remain = workable - bonding - ng_active
   
4. Replacement request created
   ↓
   Status: PENDING
   
5. Cutting processes replacement
   ↓
   replacement += processed_qty
   ng_active = ng - replacement
   remain = workable - bonding - ng_active
   
6. Replacement completed
   ↓
   replacement = ng
   ng_active = 0
   remain = workable - bonding (back to normal)
```

---

## 📊 API Integration

### Get Workable Bonding

```bash
GET /api/workable-bonding
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "week": "W01",
      "shipToName": "ACME Corp",
      "sku": "SKU-12345",
      "quantityOrder": 1000,
      "workable": 800,
      "bonding": 500,
      "ng": 50,
      "replacement": 30,
      "ng_active": 20,
      "remain": 280,
      "status": "Running",
      "remarks": "Cutting in progress"
    }
  ]
}
```

### Get Workable Bonding Detail

```bash
GET /api/workable-bonding/detail
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customerPO": "CUST-PO-123",
      "shipToName": "ACME Corp",
      "sku": "SKU-12345",
      "week": "W01",
      "quantityOrder": 1000,
      "Layer 1": 850,
      "Layer 2": 800,
      "Layer 3": 820,
      "Layer 4": 810,
      "Hole": 830,
      "workable": 800,
      "bonding": 500,
      "ng": 50,
      "replacement": 30,
      "ng_active": 20,
      "remain": 280,
      "status": "Running",
      "remarks": "Cutting in progress"
    }
  ]
}
```

---

## 🧪 Testing

### Test Data Setup

```sql
-- 1. Insert bonding production
INSERT INTO bonding_summary (customer_po, sku, quantity_produksi, ...)
VALUES ('CUST-PO-123', 'SKU-12345', 500, ...);

-- 2. Insert NG/reject
INSERT INTO bonding_reject (customer_po, sku, ng_quantity, status, ...)
VALUES ('CUST-PO-123', 'SKU-12345', 50, 'REPLACEMENT_REQUESTED', ...);

-- 3. Insert replacement progress
INSERT INTO replacement_progress (bonding_reject_id, requested_qty, processed_qty, status, ...)
VALUES ('uuid-bonding-reject', 50, 30, 'IN_PROGRESS', ...);

-- 4. Query view
SELECT * FROM v_workable_bonding WHERE sku = 'SKU-12345';
```

### Expected Results

```
sku: SKU-12345
workable: 800
bonding: 500
ng: 50
replacement: 30
ng_active: 20
remain: 280
```

---

## 📝 View Update Script

**File:** `setup_views.sql`

**To apply changes:**

```bash
# SQLite
sqlite3 dev.sqlite < setup_views.sql

# PostgreSQL
psql -U postgres -d zinus_production -f setup_views.sql
```

---

## ✅ Benefits

### For Production Tracking

1. **Real-time NG tracking**
   - See total NG per SKU
   - Track active NG (not yet replaced)
   - Monitor replacement progress

2. **Accurate remain calculation**
   - Workable reduced by active NG
   - Automatic adjustment when replacement processed
   - Prevents over-production

3. **Complete visibility**
   - See all metrics in one view
   - Track NG lifecycle
   - Monitor replacement status

### For Planning

1. **Better resource allocation**
   - Know exact remaining quantity
   - Account for NG in planning
   - Track replacement needs

2. **Quality monitoring**
   - Track NG trends
   - Identify quality issues
   - Monitor replacement efficiency

3. **Accurate reporting**
   - Complete production picture
   - NG impact on workable
   - Replacement effectiveness

---

## 🔍 Troubleshooting

### Issue: NG not showing in view

**Check:**
1. Verify `bonding_reject` table has data
2. Check status is not 'CANCELLED'
3. Verify customer_po and sku match

### Issue: Replacement not reducing NG

**Check:**
1. Verify `replacement_progress` linked to `bonding_reject`
2. Check replacement status is 'IN_PROGRESS' or 'COMPLETED'
3. Verify processed_qty > 0

### Issue: Remain calculation incorrect

**Check:**
1. Verify workable calculation (min of all layers)
2. Check bonding total
3. Verify ng_active = ng - replacement
4. Check formula: remain = workable - bonding - ng_active

---

## 📊 Summary

### New Columns Added

- ✅ **ng** - Total NG/reject quantity
- ✅ **replacement** - Total replacement processed
- ✅ **ng_active** - Active NG (not yet replaced)

### Formula Changes

**Before:**
```
remain = workable - bonding
```

**After:**
```
remain = workable - bonding - ng_active
```

### Integration Points

- ✅ `bonding_reject` table
- ✅ `replacement_progress` table
- ✅ Automatic calculation
- ✅ Real-time updates

---

**Status:** ✅ Complete & Ready  
**Last Updated:** January 9, 2025  
**Version:** 2.0.0
