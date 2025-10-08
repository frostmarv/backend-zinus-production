# Quick Start: Remain Quantity

## TL;DR

**2 Endpoints untuk 2 Use Case:**

### 1. Cutting (Special Case)
```bash
GET /master-data/remain-quantity?customerPo=X&sku=Y&sCode=Z
```
- Untuk cutting department saja
- Butuh sCode karena per layer

### 2. All Other Departments (Generic)
```bash
GET /master-data/remain-quantity-department?customerPo=X&sku=Y&department=bonding
```
- Untuk bonding, assembly, packing, dll
- Scalable: tambah department baru hanya 3 langkah

## Usage

### Bonding
```bash
curl "http://localhost:5000/master-data/remain-quantity-department?customerPo=0879611929&sku=SPT-STR-800F&department=bonding"
```

### Response
```json
{
  "quantityOrder": 1560,
  "totalProduced": 450,
  "remainQuantity": 1110
}
```

## Add New Department (3 Steps)

1. **Create Entity** → `{department}_summary.entity.ts`
2. **Add to Module** → Import entity
3. **Add Case** → Add switch case in service

Done! ✅

## Docs

- 📖 Full Guide: `BONDING_REMAIN_QUANTITY.md`
- 🏗️ Architecture: `REMAIN_QUANTITY_ARCHITECTURE.md`
