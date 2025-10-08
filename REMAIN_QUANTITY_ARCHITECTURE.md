# Remain Quantity Architecture - Scalable Design

## Overview

Arsitektur **scalable** untuk menghitung remain quantity di semua department dengan 2 pattern berbeda:

### Pattern 1: Cutting (Special Case)
- **Endpoint**: `/master-data/remain-quantity`
- **Parameters**: `customerPo`, `sku`, `sCode`
- **Reason**: Cutting punya multiple layers per SKU, butuh tracking per layer (sCode)

### Pattern 2: Generic Department (Scalable)
- **Endpoint**: `/master-data/remain-quantity-department`
- **Parameters**: `customerPo`, `sku`, `department`
- **Departments**: bonding, assembly, packing, dll
- **Reason**: Department lain 1 SKU = 1 produk final, tidak perlu sCode

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Master Data Service                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  getRemainQuantity(customerPo, sku, sCode)                  │
│  └─> For CUTTING only (per layer)                           │
│      └─> Query: production_cutting_entry                    │
│                                                               │
│  getRemainQuantityByDepartment(customerPo, sku, department) │
│  └─> For ALL other departments (generic)                    │
│      ├─> bonding    → bonding_summary                       │
│      ├─> assembly   → assembly_summary (future)             │
│      ├─> packing    → packing_summary (future)              │
│      └─> ...        → easy to add new department            │
│                                                               │
│  getRemainQuantityBonding(customerPo, sku)                  │
│  └─> Wrapper for backward compatibility                     │
│      └─> Calls getRemainQuantityByDepartment('bonding')     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Endpoints Summary

| Endpoint | Use Case | Parameters | Department |
|----------|----------|------------|------------|
| `/remain-quantity` | Cutting (special) | `customerPo`, `sku`, `sCode` | cutting |
| `/remain-quantity-department` | Generic (scalable) | `customerPo`, `sku`, `department` | bonding, assembly, packing, dll |
| `/remain-quantity-bonding` | Backward compat | `customerPo`, `sku` | bonding only |

## Formula

Semua department menggunakan formula yang sama:

```typescript
remainQuantity = quantityOrder - totalProduced
```

**Where:**
- `quantityOrder`: Total dari production_order_items (planned_qty)
- `totalProduced`: SUM(quantity_produksi) dari tabel department

## Implementation

### Current (Bonding)

```typescript
// Service
async getRemainQuantityByDepartment(customerPo, sku, department) {
  const quantityOrder = await getFromProductionOrder();
  
  switch (department) {
    case 'bonding':
      totalProduced = await SUM(bonding_summary.quantity_produksi);
      break;
    // ... other departments
  }
  
  return { quantityOrder, totalProduced, remainQuantity };
}

// Controller
@Get('remain-quantity-department')
async getRemainQuantityDepartment(
  @Query('customerPo') customerPo,
  @Query('sku') sku,
  @Query('department') department,
) {
  return this.service.getRemainQuantityByDepartment(customerPo, sku, department);
}
```

### Adding New Department (3 Steps)

**Example: Assembly Department**

#### Step 1: Create Entity
```typescript
// src/entities/assembly-summary.entity.ts
@Entity('assembly_summary')
export class AssemblySummary {
  @Column({ name: 'customer_po' })
  customerPo: string;

  @Column()
  sku: string;

  @Column({ name: 'quantity_produksi' })
  quantityProduksi: number;
}
```

#### Step 2: Add to Module
```typescript
// src/modules/master-data/master-data.module.ts
TypeOrmModule.forFeature([
  // ... existing
  AssemblySummary, // ✅ Add this
])
```

#### Step 3: Add Case in Service
```typescript
// src/modules/master-data/master-data.service.ts
constructor(
  @InjectRepository(AssemblySummary)
  private assemblySummaryRepo: Repository<AssemblySummary>,
) {}

// In getRemainQuantityByDepartment:
case 'assembly':
  const assemblyTotal = await this.assemblySummaryRepo
    .createQueryBuilder('as')
    .where('as.customer_po = :customerPo', { customerPo })
    .andWhere('as.sku = :sku', { sku })
    .select('COALESCE(SUM(as.quantity_produksi), 0)', 'total')
    .getRawOne();
  totalProduced = Number(assemblyTotal?.total || 0);
  break;
```

**Done!** ✅ Endpoint ready:
```bash
GET /master-data/remain-quantity-department?customerPo=X&sku=Y&department=assembly
```

## Benefits

### ✅ Scalability
- Add new department: 3 steps, ~10 lines of code
- No need to create new endpoints
- Consistent pattern across all departments

### ✅ Maintainability
- Single source of truth for remain quantity logic
- Easy to update formula if needed
- Clear separation: cutting vs generic

### ✅ Type Safety
- TypeScript union types for department names
- Compile-time checks for supported departments
- Runtime error for unsupported departments

### ✅ Backward Compatibility
- Old endpoint `/remain-quantity-bonding` still works
- Gradual migration possible
- No breaking changes

## Testing

### Test Generic Endpoint

```bash
# Bonding
curl "http://localhost:5000/master-data/remain-quantity-department?customerPo=0879611929&sku=SPT-STR-800F&department=bonding"

# Assembly (after implementation)
curl "http://localhost:5000/master-data/remain-quantity-department?customerPo=0879611929&sku=SPT-STR-800F&department=assembly"

# Unsupported department (will throw error)
curl "http://localhost:5000/master-data/remain-quantity-department?customerPo=0879611929&sku=SPT-STR-800F&department=unknown"
```

### Expected Response

```json
{
  "quantityOrder": 1560,
  "totalProduced": 450,
  "remainQuantity": 1110
}
```

### Error Response (Unsupported Department)

```json
{
  "statusCode": 500,
  "message": "Department 'unknown' is not supported yet"
}
```

## Future Departments

Ready to add:
- 🔜 Assembly
- 🔜 Packing
- 🔜 Quality Control
- 🔜 Shipping
- 🔜 Any other department

Each takes only **3 steps** and **~10 lines of code**!

## Migration Guide

### For Flutter/Frontend

**Old way (bonding specific):**
```dart
final remainData = await repo.getRemainQuantity(customerPo, sku, sCode);
```

**New way (generic, recommended):**
```dart
final remainData = await repo.getRemainQuantityByDepartment(
  customerPo, 
  sku, 
  'bonding'
);
```

**Backward compatible (still works):**
```dart
final remainData = await repo.getRemainQuantityBonding(customerPo, sku);
```

## Summary

| Aspect | Value |
|--------|-------|
| **Scalability** | ⭐⭐⭐⭐⭐ Easy to add departments |
| **Maintainability** | ⭐⭐⭐⭐⭐ Single source of truth |
| **Performance** | ⭐⭐⭐⭐⭐ Efficient queries |
| **Type Safety** | ⭐⭐⭐⭐⭐ TypeScript support |
| **Backward Compat** | ⭐⭐⭐⭐⭐ No breaking changes |

---

**Design Philosophy**: 
> "Make it easy to add new departments without changing the core architecture."
