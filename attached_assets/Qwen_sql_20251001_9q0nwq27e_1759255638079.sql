-- VIEW untuk halaman detail
CREATE VIEW v_workable_detail AS

WITH sku_requirements AS (
  -- Ambil kebutuhan layer per SKU
  SELECT 
    sl.product_sku AS sku,
    sl.s_code,
    sl.layer_index,
    -- Asumsi: 1 unit = 1 pcs per layer
    -- Tapi kita butuh order_qty → ambil dari cutting_inputs (max)
    (SELECT MAX(quantity_produksi) 
     FROM cutting_inputs ci2 
     WHERE ci2.sku = sl.product_sku) AS order_qty
  FROM scode_layers sl
),

cutting_summary AS (
  -- Hitung qty per layer yang sudah di-input
  SELECT 
    ci.customer_po,
    ci.sku,
    ci.s_code,
    ci.customer AS shipToName,
    ci.week,
    SUM(ci.quantity_produksi) AS actual_qty
  FROM cutting_inputs ci
  GROUP BY ci.customer_po, ci.sku, ci.s_code, ci.customer, ci.week
),

layer_status AS (
  SELECT 
    r.sku,
    r.s_code,
    r.layer_index,
    r.order_qty,
    COALESCE(c.actual_qty, 0) AS actual_qty,
    c.shipToName,
    c.week,
    c.customer_po,
    CASE 
      WHEN COALESCE(c.actual_qty, 0) >= r.order_qty THEN 1 
      ELSE 0 
    END AS is_complete
  FROM sku_requirements r
  LEFT JOIN cutting_summary c 
    ON r.sku = c.sku AND r.s_code = c.s_code
)

-- Pivot layer jadi kolom
SELECT 
  ls.week,
  ls.shipToName,
  ls.sku,
  MAX(ls.order_qty) AS quantityOrder,
  -- Layer 1
  MAX(CASE WHEN ls.layer_index = 1 THEN 
    ls.actual_qty || '/' || ls.order_qty END) AS "Layer 1",
  MAX(CASE WHEN ls.layer_index = 1 THEN ls.is_complete END) AS "Layer1_Complete",
  -- Layer 2
  MAX(CASE WHEN ls.layer_index = 2 THEN 
    ls.actual_qty || '/' || ls.order_qty END) AS "Layer 2",
  MAX(CASE WHEN ls.layer_index = 2 THEN ls.is_complete END) AS "Layer2_Complete",
  -- ... sampai Layer 4
  MAX(CASE WHEN ls.layer_index = 4 THEN 
    ls.actual_qty || '/' || ls.order_qty END) AS "Layer 4",
  MAX(CASE WHEN ls.layer_index = 4 THEN ls.is_complete END) AS "Layer4_Complete",
  -- Remarks
  CASE 
    WHEN MIN(ls.is_complete) = 1 THEN 'All layers complete'
    ELSE 'Incomplete layers'
  END AS remarks,
  CASE 
    WHEN MIN(ls.is_complete) = 1 THEN 'Workable'
    ELSE 'Pending'
  END AS status
FROM layer_status ls
GROUP BY ls.customer_po, ls.sku, ls.shipToName, ls.week;