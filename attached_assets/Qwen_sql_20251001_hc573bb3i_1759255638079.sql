-- Langkah 1: Hitung kebutuhan layer per SKU
WITH sku_layer_requirements AS (
  SELECT 
    product_sku AS sku,
    COUNT(DISTINCT s_code) AS total_layers_needed
  FROM scode_layers
  GROUP BY product_sku
),

-- Langkah 2: Hitung layer yang sudah di-input per (CustomerPO + SKU)
cutting_layer_inputs AS (
  SELECT 
    customer_po,
    sku,
    COUNT(DISTINCT s_code) AS layers_input
  FROM cutting_inputs
  WHERE s_code IS NOT NULL AND s_code != ''
  GROUP BY customer_po, sku
),

-- Langkah 3: Gabungkan & filter yang lengkap
workable_candidates AS (
  SELECT 
    c.customer_po,
    c.sku,
    c.layers_input,
    r.total_layers_needed,
    CASE 
      WHEN c.layers_input >= r.total_layers_needed THEN 1 
      ELSE 0 
    END AS is_workable
  FROM cutting_layer_inputs c
  JOIN sku_layer_requirements r ON c.sku = r.sku
)

-- Langkah 4: Ambil data tambahan untuk tampilan
SELECT 
  ci.week,
  ci.customer AS "shipToName",
  ci.sku,
  SUM(ci.quantity_produksi) AS "quantityOrder",  -- total qty per SKU
  SUM(ci.quantity_produksi) AS "progress",       -- asumsi: semua qty siap bonding
  0 AS "remain",                                 -- karena workable, remain = 0
  'Ready for bonding' AS "remarks",
  'Workable' AS "status"
FROM cutting_inputs ci
JOIN workable_candidates wc 
  ON ci.customer_po = wc.customer_po 
  AND ci.sku = wc.sku
WHERE wc.is_workable = 1
GROUP BY ci.customer_po, ci.sku, ci.week, ci.customer;