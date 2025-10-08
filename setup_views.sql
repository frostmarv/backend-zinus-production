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

-- VIEW 1: Assembly Layers
-- Note: Order by p.sku and al.layer_index when querying this view
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

-- VIEW 2: Cascading Master (dengan F.CODE, S.CODE, dan Description)
-- Note: This view is denormalized - one production item can have multiple rows (one per assembly layer)
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

-- VIEW 3: Production Planning - FOAM Products Only
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

-- VIEW 4: Production Planning - SPRING Products Only
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

-- VIEW 5: Workable Bonding (production progress tracking)
-- UPDATED: Tambah kolom bonding, workable = cutting result, remain = order - bonding
-- FILTER: Only FOAM products (SPRING excluded)
CREATE VIEW v_workable_bonding AS
WITH planned_orders AS (
  -- Base: All production orders with their planned quantities (FOAM only)
  SELECT 
    po.customer_po AS customerPO,
    c.customer_name AS shipToName,
    p.sku,
    poi.week_number AS week,
    poi.planned_qty AS quantityOrder
  FROM production_order_items poi
  JOIN production_orders po ON poi.orderOrderId = po.order_id
  JOIN customers c ON po.customerCustomerId = c.customer_id
  JOIN products p ON poi.productProductId = p.product_id
  WHERE poi.week_number IS NOT NULL
    AND p.category = 'FOAM'
),

layer_requirements AS (
  -- Get layer requirements for each SKU
  SELECT 
    po.customerPO,
    po.sku,
    po.week,
    po.shipToName,
    po.quantityOrder,
    al.second_item_number AS s_code,
    al.layer_index
  FROM planned_orders po
  JOIN products p ON po.sku = p.sku
  LEFT JOIN assembly_layers al ON p.product_id = al.productProductId
),

cutting_actuals AS (
  -- Calculate actual production per layer from cutting
  SELECT 
    pce.customerPO,
    pce.sku,
    pce.sCode AS s_code,
    pce.week,
    SUM(pce.quantityProduksi) AS actual_qty
  FROM production_cutting_entries pce
  WHERE pce.sCode IS NOT NULL AND pce.sCode != ''
  GROUP BY pce.customerPO, pce.sku, pce.sCode, pce.week
),

layer_status AS (
  -- Join requirements with cutting actuals
  SELECT 
    r.customerPO,
    r.shipToName,
    r.sku,
    r.week,
    r.quantityOrder,
    r.s_code,
    r.layer_index,
    COALESCE(a.actual_qty, 0) AS actual_qty
  FROM layer_requirements r
  LEFT JOIN cutting_actuals a 
    ON r.customerPO = a.customerPO 
    AND r.sku = a.sku 
    AND r.s_code = a.s_code 
    AND r.week = a.week
),

bonding_actuals AS (
  -- Calculate total bonding production per SKU
  SELECT 
    bs.customer_po AS customerPO,
    bs.sku,
    SUM(bs.quantity_produksi) AS bonding_qty
  FROM bonding_summary bs
  GROUP BY bs.customer_po, bs.sku
),

workable_check AS (
  SELECT 
    ls.customerPO,
    ls.shipToName,
    ls.sku,
    ls.week,
    MAX(ls.quantityOrder) AS quantityOrder,
    -- Workable = minimum of all layers (bottleneck dari cutting)
    COALESCE(MIN(ls.actual_qty), 0) AS workable,
    -- Bonding = total yang sudah diproduksi di bonding
    COALESCE(ba.bonding_qty, 0) AS bonding,
    -- Remain = workable - bonding (sisa material yang bisa dikerjakan bonding)
    COALESCE(MIN(ls.actual_qty), 0) - COALESCE(ba.bonding_qty, 0) AS remain,
    CASE 
      WHEN (COALESCE(MIN(ls.actual_qty), 0) - COALESCE(ba.bonding_qty, 0)) <= 0 THEN 'Completed'
      WHEN COALESCE(MIN(ls.actual_qty), 0) < MAX(ls.quantityOrder) THEN 'Running'
      ELSE 'Not Started'
    END AS status,
    CASE 
      WHEN (COALESCE(MIN(ls.actual_qty), 0) - COALESCE(ba.bonding_qty, 0)) <= 0 THEN 'Bonding completed'
      WHEN COALESCE(MIN(ls.actual_qty), 0) < MAX(ls.quantityOrder) THEN 'Cutting in progress'
      ELSE 'Waiting for cutting'
    END AS remarks
  FROM layer_status ls
  LEFT JOIN bonding_actuals ba 
    ON ls.customerPO = ba.customerPO 
    AND ls.sku = ba.sku
  GROUP BY ls.customerPO, ls.shipToName, ls.sku, ls.week, ba.bonding_qty
)

SELECT 
  week,
  shipToName,
  sku,
  quantityOrder,
  workable,
  bonding,
  remain,
  remarks,
  status
FROM workable_check
ORDER BY shipToName COLLATE NOCASE, sku COLLATE NOCASE;

-- VIEW 6: Workable Bonding Detail (layer breakdown)
-- UPDATED: Tambah kolom bonding, workable = min cutting, remain = order - bonding
-- FILTER: Only FOAM products (SPRING excluded)
CREATE VIEW v_workable_bonding_detail AS
WITH planned_orders AS (
  -- Base: All production orders (FOAM only)
  SELECT 
    po.customer_po AS customerPO,
    c.customer_name AS shipToName,
    p.sku,
    poi.week_number AS week,
    poi.planned_qty AS quantityOrder
  FROM production_order_items poi
  JOIN production_orders po ON poi.orderOrderId = po.order_id
  JOIN customers c ON po.customerCustomerId = c.customer_id
  JOIN products p ON poi.productProductId = p.product_id
  WHERE poi.week_number IS NOT NULL
    AND p.category = 'FOAM'
),

layer_requirements AS (
  -- Get all required layers per SKU
  SELECT 
    po.customerPO,
    po.shipToName,
    po.sku,
    po.week,
    po.quantityOrder,
    al.second_item_number AS s_code,
    al.layer_index
  FROM planned_orders po
  JOIN products p ON po.sku = p.sku
  LEFT JOIN assembly_layers al ON p.product_id = al.productProductId
),

cutting_actuals AS (
  -- Calculate actual production per layer from cutting
  SELECT 
    pce.customerPO,
    pce.sku,
    pce.sCode AS s_code,
    pce.week,
    SUM(pce.quantityProduksi) AS actual_qty
  FROM production_cutting_entries pce
  WHERE pce.sCode IS NOT NULL AND pce.sCode != ''
  GROUP BY pce.customerPO, pce.sku, pce.sCode, pce.week
),

layer_data AS (
  -- Join requirements with cutting actuals
  SELECT 
    r.customerPO,
    r.shipToName,
    r.sku,
    r.week,
    r.quantityOrder,
    r.s_code,
    r.layer_index,
    COALESCE(a.actual_qty, 0) AS actual_qty
  FROM layer_requirements r
  LEFT JOIN cutting_actuals a 
    ON r.customerPO = a.customerPO 
    AND r.sku = a.sku 
    AND r.s_code = a.s_code 
    AND r.week = a.week
),

bonding_actuals AS (
  -- Calculate total bonding production per SKU
  SELECT 
    bs.customer_po AS customerPO,
    bs.sku,
    SUM(bs.quantity_produksi) AS bonding_qty
  FROM bonding_summary bs
  GROUP BY bs.customer_po, bs.sku
),

pivot_data AS (
  SELECT 
    ld.customerPO,
    ld.shipToName,
    ld.sku,
    ld.week,
    MAX(ld.quantityOrder) AS quantityOrder,
    MAX(CASE WHEN ld.layer_index = 1 THEN ld.actual_qty END) AS "Layer 1",
    MAX(CASE WHEN ld.layer_index = 2 THEN ld.actual_qty END) AS "Layer 2",
    MAX(CASE WHEN ld.layer_index = 3 THEN ld.actual_qty END) AS "Layer 3",
    MAX(CASE WHEN ld.layer_index = 4 THEN ld.actual_qty END) AS "Layer 4",
    MAX(CASE WHEN ld.layer_index = 5 THEN ld.actual_qty END) AS "Hole",
    COALESCE(MIN(ld.actual_qty), 0) AS workable,
    COALESCE(ba.bonding_qty, 0) AS bonding
  FROM layer_data ld
  LEFT JOIN bonding_actuals ba 
    ON ld.customerPO = ba.customerPO 
    AND ld.sku = ba.sku
  GROUP BY ld.customerPO, ld.shipToName, ld.sku, ld.week, ba.bonding_qty
)

SELECT 
  customerPO,
  shipToName,
  sku,
  week,
  quantityOrder,
  COALESCE("Layer 1", 0) AS "Layer 1",
  COALESCE("Layer 2", 0) AS "Layer 2",
  COALESCE("Layer 3", 0) AS "Layer 3",
  COALESCE("Layer 4", 0) AS "Layer 4",
  COALESCE("Hole", 0) AS "Hole",
  workable,
  bonding,
  workable - bonding AS remain,
  CASE 
    WHEN (workable - bonding) <= 0 THEN 'Completed'
    WHEN workable < quantityOrder THEN 'Running'
    ELSE 'Not Started'
  END AS status,
  CASE 
    WHEN (workable - bonding) <= 0 THEN 'Bonding completed'
    WHEN workable < quantityOrder THEN 'Cutting in progress'
    ELSE 'Waiting for cutting'
  END AS remarks
FROM pivot_data
ORDER BY shipToName COLLATE NOCASE, sku COLLATE NOCASE;
