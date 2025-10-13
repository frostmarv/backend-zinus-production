-- ===================================================================
-- CREATE VIEWS ONLY (run after tables exist)
-- ===================================================================

-- Drop existing views
DROP VIEW IF EXISTS v_assembly_layers;
DROP VIEW IF EXISTS v_cascading_master;
DROP VIEW IF EXISTS v_production_planning;
DROP VIEW IF EXISTS v_production_planning_foam;
DROP VIEW IF EXISTS v_production_planning_spring;
DROP VIEW IF EXISTS v_workable_bonding;
DROP VIEW IF EXISTS v_workable_bonding_detail;
DROP VIEW IF EXISTS v_workable_bonding_ng;

-- VIEW 1: Assembly Layers (tidak berubah)
CREATE VIEW v_assembly_layers AS
SELECT
    p.item_number AS "Item Number",
    al.second_item_number AS "2nd Item Number",
    p.sku AS "SKU",
    al.description AS "Description",
    al.description_line_2 AS "Size",
    al.layer_index AS "Layer Index",
    al.category_layers AS "Category Layers"
FROM assembly_layers al
JOIN products p ON al.productProductId = p.product_id;

-- VIEW 2: Cascading Master (tidak berubah)
CREATE VIEW v_cascading_master AS
SELECT
    poi.item_id,
    c.customer_id,
    c.customer_name,
    po.po_number,
    po.customer_po,
    p.item_number AS "F.CODE",
    p.sku,
    al.second_item_number AS "S.CODE",
    al.description AS "Description",
    al.layer_index,
    poi.planned_qty,
    poi.week_number
FROM production_order_items poi
JOIN production_orders po ON poi.orderOrderId = po.order_id
JOIN customers c ON po.customerCustomerId = c.customer_id
JOIN products p ON poi.productProductId = p.product_id
LEFT JOIN assembly_layers al ON p.product_id = al.productProductId
WHERE c.is_active = 1
  AND p.is_active = 1;

-- VIEW 3: Production Planning - FOAM (tidak berubah)
CREATE VIEW v_production_planning_foam AS
SELECT
    c.customer_name AS "Ship to Name",
    po.customer_po AS "Cust. PO",
    po.po_number AS "PO No.",
    p.item_number AS "Item Number",
    p.sku AS "SKU",
    p.spec_length || '*' || p.spec_width || '*' || p.spec_height || p.spec_unit AS "Spec",
    p.item_description AS "Item Description",
    poi.i_d AS "I/D",
    poi.l_d AS "L/D",
    poi.s_d AS "S/D",
    poi.planned_qty AS "Order QTY",
    poi.sample_qty AS "Sample",
    poi.total_planned AS "Total Qty",
    poi.week_number AS "Week",
    p.category AS "Category"
FROM production_order_items poi
JOIN production_orders po ON poi.orderOrderId = po.order_id
JOIN customers c ON po.customerCustomerId = c.customer_id
JOIN products p ON poi.productProductId = p.product_id
WHERE p.category = 'FOAM'
ORDER BY po.po_number, poi.item_id;

-- VIEW 4: Production Planning - SPRING (tidak berubah)
CREATE VIEW v_production_planning_spring AS
SELECT
    c.customer_name AS "Ship to Name",
    po.customer_po AS "Cust. PO",
    po.po_number AS "PO No.",
    p.item_number AS "Item Number",
    p.sku AS "SKU",
    p.spec_length || '*' || p.spec_width || '*' || p.spec_height || p.spec_unit AS "Spec",
    p.item_description AS "Item Description",
    poi.i_d AS "I/D",
    poi.l_d AS "L/D",
    poi.s_d AS "S/D",
    poi.planned_qty AS "Order QTY",
    poi.sample_qty AS "Sample",
    poi.total_planned AS "Total Qty",
    poi.week_number AS "Week",
    p.category AS "Category"
FROM production_order_items poi
JOIN production_orders po ON poi.orderOrderId = po.order_id
JOIN customers c ON po.customerCustomerId = c.customer_id
JOIN products p ON poi.productProductId = p.product_id
WHERE p.category = 'SPRING'
ORDER BY po.po_number, poi.item_id;

-- VIEW 5: Workable Bonding (REAL-TIME, KONSISTEN, TANPA CUSTOMER PO)
CREATE VIEW v_workable_bonding AS
WITH planned_orders AS (
  SELECT 
    c.customer_name AS shipToName,
    p.sku,
    poi.week_number AS week,
    SUM(poi.planned_qty) AS quantityOrder
  FROM production_order_items poi
  JOIN production_orders po ON poi.orderOrderId = po.order_id
  JOIN customers c ON po.customerCustomerId = c.customer_id
  JOIN products p ON poi.productProductId = p.product_id
  WHERE poi.week_number IS NOT NULL
    AND p.category = 'FOAM'
  GROUP BY p.sku, poi.week_number
),

layer_requirements AS (
  SELECT 
    po.shipToName,
    po.sku,
    po.week,
    po.quantityOrder,
    COALESCE(al.second_item_number, 'MAIN') AS s_code,
    COALESCE(al.layer_index, 1) AS layer_index
  FROM planned_orders po
  JOIN products p ON po.sku = p.sku
  LEFT JOIN assembly_layers al ON p.product_id = al.productProductId
),

cutting_actuals AS (
  SELECT 
    pce.sku,
    pce.week,
    COALESCE(pce.sCode, 'MAIN') AS s_code,
    SUM(pce.quantityProduksi) AS actual_qty
  FROM production_cutting_entries pce
  WHERE pce.sku IN (SELECT sku FROM products WHERE category = 'FOAM')
    AND pce.week IS NOT NULL
  GROUP BY pce.sku, pce.week, COALESCE(pce.sCode, 'MAIN')
),

ng_per_layer AS (
  SELECT 
    br.sku,
    COALESCE(br.s_code, 'MAIN') AS s_code,
    SUM(br.ng_quantity) AS ng_qty
  FROM bonding_reject br
  WHERE br.status != 'CANCELLED'
  GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
),

replacement_per_layer AS (
  SELECT 
    br.sku,
    COALESCE(br.s_code, 'MAIN') AS s_code,
    SUM(COALESCE(rp.processed_qty, 0)) AS replacement_qty
  FROM bonding_reject br
  LEFT JOIN replacement_progress rp 
    ON br.id = rp.bonding_reject_id
  WHERE br.status != 'CANCELLED'
    AND rp.status IN ('IN_PROGRESS', 'COMPLETED')
  GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
),

net_ng_per_layer AS (
  SELECT 
    ng.sku,
    ng.s_code,
    ng.ng_qty,
    COALESCE(rp.replacement_qty, 0) AS replacement_qty,
    MAX(ng.ng_qty - COALESCE(rp.replacement_qty, 0), 0) AS net_ng_qty
  FROM ng_per_layer ng
  LEFT JOIN replacement_per_layer rp 
    ON ng.sku = rp.sku AND ng.s_code = rp.s_code
),

layer_net AS (
  SELECT 
    r.shipToName,
    r.sku,
    r.week,
    r.quantityOrder,
    r.s_code,
    r.layer_index,
    COALESCE(ca.actual_qty, 0) AS cutting_qty,
    COALESCE(ca.actual_qty, 0) - COALESCE(ng.net_ng_qty, 0) AS net_qty
  FROM layer_requirements r
  LEFT JOIN cutting_actuals ca 
    ON r.sku = ca.sku AND r.week = ca.week AND r.s_code = ca.s_code
  LEFT JOIN net_ng_per_layer ng
    ON r.sku = ng.sku AND r.s_code = ng.s_code
),

min_net_per_group AS (
  SELECT 
    sku,
    week,
    MIN(net_qty) AS min_net_qty
  FROM layer_net
  GROUP BY sku, week
),

bonding_actuals AS (
  SELECT 
    bs.sku,
    bs.week,
    SUM(bs.quantity_produksi) AS bonding_qty
  FROM bonding_summary bs
  GROUP BY bs.sku, bs.week
),

final_data AS (
  SELECT 
    ln.shipToName,
    ln.sku,
    ln.week,
    MAX(ln.quantityOrder) AS quantityOrder,
    MAX(ln.cutting_qty) AS max_cutting,
    COALESCE(mn.min_net_qty, 0) AS min_net_qty,
    COALESCE(ba.bonding_qty, 0) AS bonding,
    MAX(ln.quantityOrder) - COALESCE(ba.bonding_qty, 0) AS "Remain Produksi"
  FROM layer_net ln
  LEFT JOIN min_net_per_group mn 
    ON ln.sku = mn.sku AND ln.week = mn.week
  LEFT JOIN bonding_actuals ba 
    ON ln.sku = ba.sku AND ln.week = ba.week
  GROUP BY ln.shipToName, ln.sku, ln.week, mn.min_net_qty, ba.bonding_qty
)

SELECT 
  week,
  shipToName,
  sku,
  quantityOrder,
  CASE 
    WHEN min_net_qty - bonding > 0 THEN min_net_qty - bonding 
    ELSE 0 
  END AS workable,
  bonding,
  "Remain Produksi",
  CASE 
    WHEN "Remain Produksi" <= 0 THEN 'Completed'
    WHEN max_cutting > 0 THEN 'Running'
    ELSE 'Not Started'
  END AS status,
  CASE 
    WHEN "Remain Produksi" <= 0 THEN 'Bonding completed'
    WHEN max_cutting > 0 THEN 'Cutting in progress'
    ELSE 'Waiting for cutting'
  END AS remarks
FROM final_data
ORDER BY shipToName COLLATE NOCASE, sku COLLATE NOCASE;

-- VIEW 6: Workable Bonding Detail (REAL-TIME & KONSISTEN)
CREATE VIEW v_workable_bonding_detail AS
WITH planned_orders AS (
  SELECT 
    c.customer_name AS shipToName,
    p.sku,
    poi.week_number AS week,
    SUM(poi.planned_qty) AS quantityOrder
  FROM production_order_items poi
  JOIN production_orders po ON poi.orderOrderId = po.order_id
  JOIN customers c ON po.customerCustomerId = c.customer_id
  JOIN products p ON poi.productProductId = p.product_id
  WHERE poi.week_number IS NOT NULL
    AND p.category = 'FOAM'
  GROUP BY p.sku, poi.week_number
),

layer_requirements AS (
  SELECT 
    po.shipToName,
    po.sku,
    po.week,
    po.quantityOrder,
    COALESCE(al.second_item_number, 'MAIN') AS s_code,
    COALESCE(al.layer_index, 1) AS layer_index
  FROM planned_orders po
  JOIN products p ON po.sku = p.sku
  LEFT JOIN assembly_layers al ON p.product_id = al.productProductId
),

cutting_actuals AS (
  SELECT 
    pce.sku,
    pce.week,
    COALESCE(pce.sCode, 'MAIN') AS s_code,
    SUM(pce.quantityProduksi) AS actual_qty
  FROM production_cutting_entries pce
  WHERE pce.sku IN (SELECT sku FROM products WHERE category = 'FOAM')
    AND pce.week IS NOT NULL
  GROUP BY pce.sku, pce.week, COALESCE(pce.sCode, 'MAIN')
),

ng_per_layer AS (
  SELECT 
    br.sku,
    COALESCE(br.s_code, 'MAIN') AS s_code,
    SUM(br.ng_quantity) AS ng_qty
  FROM bonding_reject br
  WHERE br.status != 'CANCELLED'
  GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
),

replacement_per_layer AS (
  SELECT 
    br.sku,
    COALESCE(br.s_code, 'MAIN') AS s_code,
    SUM(COALESCE(rp.processed_qty, 0)) AS replacement_qty
  FROM bonding_reject br
  LEFT JOIN replacement_progress rp 
    ON br.id = rp.bonding_reject_id
  WHERE br.status != 'CANCELLED'
    AND rp.status IN ('IN_PROGRESS', 'COMPLETED')
  GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
),

net_ng_per_layer AS (
  SELECT 
    ng.sku,
    ng.s_code,
    ng.ng_qty,
    COALESCE(rp.replacement_qty, 0) AS replacement_qty,
    MAX(ng.ng_qty - COALESCE(rp.replacement_qty, 0), 0) AS net_ng_qty
  FROM ng_per_layer ng
  LEFT JOIN replacement_per_layer rp 
    ON ng.sku = rp.sku AND ng.s_code = rp.s_code
),

layer_net AS (
  SELECT 
    r.shipToName,
    r.sku,
    r.week,
    r.quantityOrder,
    r.s_code,
    r.layer_index,
    COALESCE(ca.actual_qty, 0) AS cutting_qty,
    COALESCE(ca.actual_qty, 0) - COALESCE(ng.net_ng_qty, 0) AS net_qty
  FROM layer_requirements r
  LEFT JOIN cutting_actuals ca 
    ON r.sku = ca.sku AND r.week = ca.week AND r.s_code = ca.s_code
  LEFT JOIN net_ng_per_layer ng
    ON r.sku = ng.sku AND r.s_code = ng.s_code
),

min_net_per_group AS (
  SELECT 
    sku,
    week,
    MIN(net_qty) AS min_net_qty
  FROM layer_net
  GROUP BY sku, week
),

bonding_actuals AS (
  SELECT 
    bs.sku,
    bs.week,
    SUM(bs.quantity_produksi) AS bonding_qty
  FROM bonding_summary bs
  GROUP BY bs.sku, bs.week
),

final_pivot AS (
  SELECT 
    ln.shipToName,
    ln.sku,
    ln.week,
    MAX(ln.quantityOrder) AS quantityOrder,
    MAX(ln.cutting_qty) AS max_cutting,
    MAX(CASE WHEN ln.layer_index = 1 THEN ln.net_qty END) AS "Layer 1",
    MAX(CASE WHEN ln.layer_index = 2 THEN ln.net_qty END) AS "Layer 2",
    MAX(CASE WHEN ln.layer_index = 3 THEN ln.net_qty END) AS "Layer 3",
    MAX(CASE WHEN ln.layer_index = 4 THEN ln.net_qty END) AS "Layer 4",
    MAX(CASE WHEN ln.layer_index = 5 THEN ln.net_qty END) AS "Hole",
    COALESCE(mn.min_net_qty, 0) AS min_net_qty,
    COALESCE(ba.bonding_qty, 0) AS bonding,
    MAX(ln.quantityOrder) - COALESCE(ba.bonding_qty, 0) AS "Remain Produksi"
  FROM layer_net ln
  LEFT JOIN min_net_per_group mn 
    ON ln.sku = mn.sku AND ln.week = mn.week
  LEFT JOIN bonding_actuals ba 
    ON ln.sku = ba.sku AND ln.week = ba.week
  GROUP BY ln.shipToName, ln.sku, ln.week, mn.min_net_qty, ba.bonding_qty
)

SELECT 
  shipToName,
  sku,
  week,
  quantityOrder,
  COALESCE("Layer 1", 0) AS "Layer 1",
  COALESCE("Layer 2", 0) AS "Layer 2",
  COALESCE("Layer 3", 0) AS "Layer 3",
  COALESCE("Layer 4", 0) AS "Layer 4",
  COALESCE("Hole", 0) AS "Hole",
  CASE 
    WHEN min_net_qty - bonding > 0 THEN min_net_qty - bonding 
    ELSE 0 
  END AS workable,
  bonding,
  "Remain Produksi",
  CASE 
    WHEN "Remain Produksi" <= 0 THEN 'Completed'
    WHEN max_cutting > 0 THEN 'Running'
    ELSE 'Not Started'
  END AS status,
  CASE 
    WHEN "Remain Produksi" <= 0 THEN 'Bonding completed'
    WHEN max_cutting > 0 THEN 'Cutting in progress'
    ELSE 'Waiting for cutting'
  END AS remarks
FROM final_pivot
ORDER BY shipToName COLLATE NOCASE, sku COLLATE NOCASE;

-- VIEW 7: Workable Bonding NG (Tracking NG & Replacement - REAL-TIME)
CREATE VIEW v_workable_bonding_ng AS
WITH planned_orders AS (
  SELECT 
    c.customer_name AS shipToName,
    p.sku,
    poi.week_number AS week,
    SUM(poi.planned_qty) AS quantityOrder
  FROM production_order_items poi
  JOIN production_orders po ON poi.orderOrderId = po.order_id
  JOIN customers c ON po.customerCustomerId = c.customer_id
  JOIN products p ON poi.productProductId = p.product_id
  WHERE poi.week_number IS NOT NULL
    AND p.category = 'FOAM'
  GROUP BY p.sku, poi.week_number
),

layer_map AS (
  SELECT 
    p.sku,
    COALESCE(al.second_item_number, 'MAIN') AS s_code,
    COALESCE(al.layer_index, 1) AS layer_index
  FROM products p
  LEFT JOIN assembly_layers al ON p.product_id = al.productProductId
  WHERE p.category = 'FOAM'
),

ng_raw AS (
  SELECT 
    br.sku,
    COALESCE(br.s_code, 'MAIN') AS s_code,
    SUM(br.ng_quantity) AS ng_qty
  FROM bonding_reject br
  WHERE br.status != 'CANCELLED'
  GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
),

replacement_raw AS (
  SELECT 
    br.sku,
    COALESCE(br.s_code, 'MAIN') AS s_code,
    SUM(COALESCE(rp.processed_qty, 0)) AS replacement_qty
  FROM bonding_reject br
  LEFT JOIN replacement_progress rp 
    ON br.id = rp.bonding_reject_id
  WHERE br.status != 'CANCELLED'
    AND rp.status IN ('IN_PROGRESS', 'COMPLETED')
  GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
),

net_ng_with_layer AS (
  SELECT 
    ng.sku,
    ng.s_code,
    lm.layer_index,
    MAX(ng.ng_qty - COALESCE(rp.replacement_qty, 0), 0) AS net_ng_qty,
    COALESCE(rp.replacement_qty, 0) AS replacement_qty
  FROM ng_raw ng
  JOIN layer_map lm 
    ON ng.sku = lm.sku AND ng.s_code = lm.s_code
  LEFT JOIN replacement_raw rp 
    ON ng.sku = rp.sku AND ng.s_code = rp.s_code
),

combined AS (
  SELECT 
    po.shipToName,
    po.sku,
    po.week,
    po.quantityOrder,
    ng.layer_index,
    ng.net_ng_qty AS ng_qty,
    ng.replacement_qty
  FROM planned_orders po
  JOIN net_ng_with_layer ng 
    ON po.sku = ng.sku
),

pivoted AS (
  SELECT 
    shipToName,
    sku,
    week,
    MAX(quantityOrder) AS quantityOrder,
    SUM(CASE WHEN layer_index = 1 THEN ng_qty ELSE 0 END) AS "NG Layer 1",
    SUM(CASE WHEN layer_index = 2 THEN ng_qty ELSE 0 END) AS "NG Layer 2",
    SUM(CASE WHEN layer_index = 3 THEN ng_qty ELSE 0 END) AS "NG Layer 3",
    SUM(CASE WHEN layer_index = 4 THEN ng_qty ELSE 0 END) AS "NG Layer 4",
    SUM(CASE WHEN layer_index = 5 THEN ng_qty ELSE 0 END) AS "NG Hole",
    SUM(CASE WHEN layer_index = 1 THEN replacement_qty ELSE 0 END) AS "Replacement Layer 1",
    SUM(CASE WHEN layer_index = 2 THEN replacement_qty ELSE 0 END) AS "Replacement Layer 2",
    SUM(CASE WHEN layer_index = 3 THEN replacement_qty ELSE 0 END) AS "Replacement Layer 3",
    SUM(CASE WHEN layer_index = 4 THEN replacement_qty ELSE 0 END) AS "Replacement Layer 4",
    SUM(CASE WHEN layer_index = 5 THEN replacement_qty ELSE 0 END) AS "Replacement Hole"
  FROM combined
  GROUP BY shipToName, sku, week
)

SELECT 
  po.shipToName,
  po.sku,
  po.week,
  po.quantityOrder,
  COALESCE(pv."NG Layer 1", 0) AS "NG Layer 1",
  COALESCE(pv."NG Layer 2", 0) AS "NG Layer 2",
  COALESCE(pv."NG Layer 3", 0) AS "NG Layer 3",
  COALESCE(pv."NG Layer 4", 0) AS "NG Layer 4",
  COALESCE(pv."NG Hole", 0) AS "NG Hole",
  COALESCE(pv."Replacement Layer 1", 0) AS "Replacement Layer 1",
  COALESCE(pv."Replacement Layer 2", 0) AS "Replacement Layer 2",
  COALESCE(pv."Replacement Layer 3", 0) AS "Replacement Layer 3",
  COALESCE(pv."Replacement Layer 4", 0) AS "Replacement Layer 4",
  COALESCE(pv."Replacement Hole", 0) AS "Replacement Hole"
FROM planned_orders po
LEFT JOIN pivoted pv 
  ON po.sku = pv.sku
  AND po.week = pv.week
ORDER BY po.shipToName COLLATE NOCASE, po.sku COLLATE NOCASE;