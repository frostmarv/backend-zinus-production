-- ===================================================================
-- SETUP DATA UNTUK DEVELOPMENT DATABASE
-- Data ASLI FINAL dari production database Zinus
-- Hanya INSERT DATA - TANPA CREATE TABLE atau VIEW
-- Tabel sudah dibuat oleh TypeORM synchronize
-- View akan dibuat setelah server start
-- ===================================================================

-- Aktifkan foreign key
PRAGMA foreign_keys = ON;

-- ===================================================================
-- DATA INSERTION (hanya jika belum ada)
-- ===================================================================

-- 1. Customers
INSERT OR IGNORE INTO customers (customer_name, customer_code) VALUES
('WMT US STORE', 'WMT-US'),
('AMAZON DI', 'AMZ-DI'),
('WMT.COM', 'WMT-COM'),
('WAY FAIR US', 'WF-US'),
('Mellow Inc (Amazon DI)', 'MELLOW-DI'),
('PT. Zinus Furniture Indonesia', 'ZINUS-ID');

-- 2. Products (FOAM & SPRING) - Data FINAL dari tabel user
INSERT OR IGNORE INTO products (item_number, sku, category, spec_length, spec_width, spec_height, spec_unit, item_description) VALUES
-- FOAM Products
('F.MFM.08F.002.WS', 'SPT-STR-800F', 'FOAM', 75, 54, 8, 'IN', '8IN SP MFM FL'),
('F.MFM.10F.002.AD', 'AZ-CMM-1000F', 'FOAM', 75, 54, 10, 'IN', '10IN CL MFM FL'),
('F.MFG.06F.001.WT', 'CLE-06F', 'FOAM', 75, 54, 6, 'IN', '6IN COOLING MFG FL'),
('F.MFG.12K.006.WA', 'WF-GIFGM-12K', 'FOAM', 80, 76, 12, 'IN', '12IN GIFGM EK'),
('F.MFG.05T.003.BD', '5GM-T-IN', 'FOAM', 75, 39, 5, 'IN', '5IN GM TW'),
('F.MFM.05N.000.ID', 'ID-MFMB5HZI-05S', 'FOAM', 200, 90, 5, 'IN', '5IN HIGH DENSITY MFM NT'),

-- SPRING Products
('F.MSS.12T.005.AD', 'MSHEBT-12T', 'SPRING', 75, 39, 12, 'IN', '12IN NEBT MSS TW'),
('F.MSS.08Q.005.BD', 'BP-MSSA5AZI-08Q', 'SPRING', 80, 60, 8, 'IN', '8IN BONNEL QN'),
('F.MSS.06T.002.WS', 'MS24-6T', 'SPRING', 75, 39, 6, 'IN', '6IN MSS24-6TW'),
('F.MSH.14F.005.WA', 'WF-MSHPHM-14F', 'SPRING', 75, 54, 14, 'IN', '14IN SLEEP PLUSH HYBRID FL'),
('F.MSS.08F.007.WT', 'MS24-8F', 'SPRING', 75, 54, 8, 'IN', '8IN MSS24-8FL');

-- 3. Production Orders (DATA FINAL - urutan sesuai tabel user)
INSERT OR IGNORE INTO production_orders (customerCustomerId, customer_po, po_number, order_date) VALUES
-- order_id=1: WMT US STORE | 0879611929
(1, '0879611929', '0879611929', '2023-01-08'),
-- order_id=2: AMAZON DI | 8HUH47JT → ADMT2501B3N
(2, '8HUH47JT', 'ADMT2501B3N', '2023-01-08'),
-- order_id=3: WMT.COM | 0876491485
(3, '0876491485', '0876491485', '2023-01-08'),
-- order_id=4: WAY FAIR US | WFIN00047
(4, 'WFIN00047', 'WFIN00047', '2023-01-08'),
-- order_id=5: Mellow Inc | 18FFPY2D → BPM195032
(5, '18FFPY2D', 'BPM195032', '2023-01-08'),
-- order_id=6: PT. Zinus | 25001
(6, '25001', '25001', '2023-01-08'),
-- order_id=7: AMAZON DI | 1VD7EMYP → ADMT2501B3S
(2, '1VD7EMYP', 'ADMT2501B3S', '2023-01-08'),
-- order_id=8: Mellow Inc | 6AUN3HUY → BPMAMZ2505E3T
(5, '6AUN3HUY', 'BPMAMZ2505E3T', '2023-01-08'),
-- order_id=9: WMT US STORE | 0902161994
(1, '0902161994', '0902161994', '2023-01-08'),
-- order_id=10: WAY FAIR US | WFIN00081
(4, 'WFIN00081', 'WFIN00081', '2023-01-08'),
-- order_id=11: WMT.COM | 0876491311
(3, '0876491311', '0876491311', '2023-01-08');

-- 4. Production Order Items (DATA FINAL - PERSIS sesuai tabel user)
-- Semua tanggal: I/D=01/08, L/D=01/09, S/D=01/12, Week=1
INSERT OR IGNORE INTO production_order_items (orderOrderId, productProductId, planned_qty, sample_qty, week_number, i_d, l_d, s_d) VALUES
-- Row 1: WMT US STORE | 0879611929 | SPT-STR-800F | 1560
(1, 1, 1560, 0, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 2: AMAZON DI | 8HUH47JT | ADMT2501B3N | AZ-CMM-1000F | 117
(2, 2, 117, 0, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 3: WMT.COM | 0876491485 | CLE-06F | 50 (sample 2)
(3, 3, 50, 2, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 4: WAY FAIR US | WFIN00047 | WF-GIFGM-12K | 25
(4, 4, 25, 0, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 5: Mellow Inc | 18FFPY2D | BPM195032 | 5GM-T-IN | 30
(5, 5, 30, 0, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 6: PT. Zinus | 25001 | ID-MFMB5HZI-05S | 100
(6, 6, 100, 0, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 7: AMAZON DI | 1VD7EMYP | ADMT2501B3S | MSHEBT-12T | 20
(7, 7, 20, 0, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 8: Mellow Inc | 6AUN3HUY | BPMAMZ2505E3T | BP-MSSA5AZI-08Q | 150 (sample 1)
(8, 8, 150, 1, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 9: WMT US STORE | 0902161994 | MS24-6T | 2616
(9, 9, 2616, 0, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 10: WAY FAIR US | WFIN00081 | WF-MSHPHM-14F | 200
(10, 10, 200, 0, 1, '2023-01-08', '2023-01-09', '2023-01-12'),

-- Row 11: WMT.COM | 0876491311 | MS24-8F | 528
(11, 11, 528, 0, 1, '2023-01-08', '2023-01-09', '2023-01-12');

-- 5. Assembly Layers (berdasarkan SKU)
-- productProductId adalah FK ke products.product_id
INSERT OR IGNORE INTO assembly_layers (productProductId, second_item_number, description, description_line_2, layer_index) VALUES
-- SPT-STR-800F (product_id=1): WMT US STORE | 0929415192
(1, 'S.MB01.05414.00', 'FM SLICE BE FLAT H32D_25', '75*54*6IN', 1),
(1, 'S.MB02.00176.00', 'FM SLICE GR FLAT M40D_9', '75*54*2IN', 2),

-- WF-GIFGM-12K (product_id=4): WAYFAIR US | WFIN00292
(4, 'S.MB01.05916.00', 'FM SLICE BE FLAT H26D_25', '80*76*3.5IN', 1),
(4, 'S.MB01.06172.00', 'FM SLICE BM FLAT H26D_20', '80*76*1IN', 2),
(4, 'S.MB01.06377.00', 'FM SLICE BE FLAT H26D_29', '80*76*7IN', 3),
(4, 'S.MB02.02783.00', 'FM SLICE BM FLAT M27D_9', '80*76*1IN', 4);
