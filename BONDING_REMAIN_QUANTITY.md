# Department Remain Quantity - Auto Calculate (Scalable)

## Overview

Endpoint **generic dan scalable** untuk menghitung **remain quantity** (sisa produksi yang belum dikerjakan) di semua department secara otomatis.

**Supported Departments:**
- ✅ **Bonding** (sudah aktif)
- 🔜 **Assembly** (tinggal tambah entity & case)
- 🔜 **Packing** (tinggal tambah entity & case)
- 🔜 **Department lain** (mudah ditambahkan)

**Note:** Cutting punya endpoint terpisah karena case khusus (pakai sCode per layer).

## Cara Kerja

Sistem akan menghitung:
```
remainQuantity = quantityOrder - totalProduced
```

Dimana:
- **quantityOrder**: Total quantity dari production order (dari tabel `production_order_items`)
- **totalProduced**: Total quantity yang sudah diproduksi di Bonding (dari tabel `bonding_summary`)

## Endpoints

### 1. Generic Endpoint (Recommended) ⭐

**GET /master-data/remain-quantity-department**

Endpoint generic untuk semua department. Scalable dan mudah ditambahkan department baru.

**Query Parameters:**
- `customerPo` (required): Customer PO number
- `sku` (required): Product SKU
- `department` (required): Department name (bonding, assembly, packing, dll)

**Example Request:**
```bash
# Bonding
GET /master-data/remain-quantity-department?customerPo=0879611929&sku=SPT-STR-800F&department=bonding

# Assembly (future)
GET /master-data/remain-quantity-department?customerPo=0879611929&sku=SPT-STR-800F&department=assembly

# Packing (future)
GET /master-data/remain-quantity-department?customerPo=0879611929&sku=SPT-STR-800F&department=packing
```

**Example Response:**
```json
{
  "quantityOrder": 1560,
  "totalProduced": 450,
  "remainQuantity": 1110
}
```

### 2. Bonding Specific Endpoint (Backward Compatibility)

**GET /master-data/remain-quantity-bonding**

Endpoint khusus bonding untuk backward compatibility. Internally redirect ke endpoint generic.

**Query Parameters:**
- `customerPo` (required): Customer PO number
- `sku` (required): Product SKU

**Example Request:**
```bash
GET /master-data/remain-quantity-bonding?customerPo=0879611929&sku=SPT-STR-800F
```

## Integrasi dengan Flutter

### Update Repository

Di Flutter, tambahkan method baru di `MasterDataRepository`:

```dart
Future<Map<String, dynamic>> getRemainQuantityBonding(
  String customerPo,
  String sku,
) async {
  final response = await http.get(
    Uri.parse('$baseUrl/master-data/remain-quantity-bonding')
        .replace(queryParameters: {
      'customerPo': customerPo,
      'sku': sku,
    }),
  );

  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to load remain quantity bonding');
  }
}
```

### Update Input Form

Di `input_bonding_summary.dart`, ganti pemanggilan `getRemainQuantity` dengan `getRemainQuantityBonding`:

**Sebelum:**
```dart
final remainData = await _repo.getRemainQuantity(customerPo, sku, sCode);
```

**Sesudah:**
```dart
final remainData = await _repo.getRemainQuantityBonding(customerPo, sku);
```

Karena bonding tidak menggunakan `sCode`, cukup gunakan `customerPo` dan `sku` saja.

### Update _loadAllData Method

```dart
Future<void> _loadAllData(String customerPo, String sku) async {
  setState(() => _loadingData = true);
  try {
    final qtyPlansData = await _repo.getQtyPlans(customerPo, sku);
    int? qtyOrder;

    if (qtyPlansData.isNotEmpty) {
      final firstPlan = qtyPlansData[0] as Map<String, dynamic>;
      final qtyValue = firstPlan['value'];
      qtyOrder = qtyValue is int ? qtyValue : int.tryParse(qtyValue.toString());
    }

    final weeksData = await _repo.getWeeks(customerPo, sku);
    String? weekValue;
    if (weeksData.isNotEmpty) {
      final firstWeek = weeksData[0] as Map<String, dynamic>;
      weekValue = firstWeek['value']?.toString();
    }

    // ✅ Gunakan endpoint bonding
    final remainData = await _repo.getRemainQuantityBonding(customerPo, sku);
    
    final remainQty = remainData['remainQuantity'] is int
        ? remainData['remainQuantity'] as int
        : int.tryParse(remainData['remainQuantity'].toString());

    qtyOrder ??= remainData['quantityOrder'] is int
        ? remainData['quantityOrder'] as int
        : int.tryParse(remainData['quantityOrder'].toString());

    if (mounted) {
      setState(() {
        _quantityOrder = qtyOrder;
        _remainQuantity = remainQty;
        _week = weekValue;
        _loadingData = false;
      });
    }
  } catch (e) {
    if (mounted) {
      setState(() => _loadingData = false);
      _showError('Gagal memuat data master');
    }
  }
}
```

## Test Endpoint

### Test dengan cURL

```bash
# Test dengan data yang ada
curl "http://localhost:5000/master-data/remain-quantity-bonding?customerPo=0879611929&sku=SPT-STR-800F"
```

### Expected Response

**Sebelum ada produksi:**
```json
{
  "quantityOrder": 1560,
  "totalProduced": 0,
  "remainQuantity": 1560
}
```

**Setelah input 100 pcs:**
```json
{
  "quantityOrder": 1560,
  "totalProduced": 100,
  "remainQuantity": 1460
}
```

**Setelah input total 450 pcs:**
```json
{
  "quantityOrder": 1560,
  "totalProduced": 450,
  "remainQuantity": 1110
}
```

## Perbedaan dengan Cutting

| Aspect | Cutting | Generic Department |
|--------|---------|-------------------|
| Endpoint | `/master-data/remain-quantity` | `/master-data/remain-quantity-department` |
| Parameters | `customerPo`, `sku`, `sCode` | `customerPo`, `sku`, `department` |
| Data Source | `production_cutting_entry` | `bonding_summary`, `assembly_summary`, dll |
| Granularity | Per layer (sCode) | Per SKU |
| Use Case | Cutting punya multiple layers | Department lain 1 SKU = 1 produk final |

## Database Query

Backend akan menjalankan query seperti ini:

```sql
-- Get quantity order
SELECT COALESCE(SUM(poi.planned_qty), 0) as quantityOrder
FROM production_order_items poi
INNER JOIN production_orders po ON poi.orderOrderId = po.order_id
INNER JOIN products p ON poi.productProductId = p.product_id
WHERE po.customer_po = '0879611929'
  AND p.sku = 'SPT-STR-800F';

-- Get total produced
SELECT COALESCE(SUM(bs.quantity_produksi), 0) as totalProduced
FROM bonding_summary bs
WHERE bs.customer_po = '0879611929'
  AND bs.sku = 'SPT-STR-800F';

-- Calculate remain
-- remainQuantity = quantityOrder - totalProduced
```

## Benefits

✅ **Real-time calculation**: Remain quantity selalu update otomatis
✅ **No manual tracking**: Tidak perlu input manual remain quantity
✅ **Accurate**: Data langsung dari database produksi
✅ **Simple**: Hanya butuh customerPo dan sku

## Cara Menambah Department Baru

Sangat mudah! Hanya 3 langkah:

### 1. Buat Entity untuk Department Baru

Contoh untuk Assembly:

```typescript
// src/entities/assembly-summary.entity.ts
@Entity('assembly_summary')
export class AssemblySummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_po', type: 'varchar', length: 100 })
  customerPo: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ name: 'quantity_produksi', type: 'int' })
  quantityProduksi: number;

  // ... field lainnya
}
```

### 2. Tambahkan ke MasterDataModule

```typescript
// src/modules/master-data/master-data.module.ts
import { AssemblySummary } from '../../entities/assembly-summary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // ... entities lain
      AssemblySummary, // ✅ Tambahkan ini
    ]),
  ],
})
```

### 3. Tambahkan Case di Service

```typescript
// src/modules/master-data/master-data.service.ts
constructor(
  // ... repositories lain
  @InjectRepository(AssemblySummary)
  private assemblySummaryRepo: Repository<AssemblySummary>,
) {}

// Di method getRemainQuantityByDepartment, tambahkan case:
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

**Done!** ✅ Endpoint langsung bisa dipakai:
```bash
GET /master-data/remain-quantity-department?customerPo=X&sku=Y&department=assembly
```

## Architecture Benefits

✅ **Scalable**: Tambah department baru hanya 3 langkah
✅ **Maintainable**: Semua logic remain quantity di 1 method
✅ **Consistent**: Semua department pakai formula yang sama
✅ **Backward Compatible**: Endpoint lama tetap jalan
✅ **Type Safe**: TypeScript union type untuk department names

## Notes

- Remain quantity akan **berkurang otomatis** setiap kali ada input produksi baru
- Jika `remainQuantity` negatif, berarti ada over-production
- Data `quantityOrder` diambil dari master production order
- Data `totalProduced` dihitung dari semua record di `{department}_summary` untuk customerPo + sku yang sama
- Cutting tetap pakai endpoint terpisah karena case khusus (per layer dengan sCode)
