-- Script untuk mensinkronkan HPP (COGS) khusus pesanan tanggal 24 September 2026
-- HANYA untuk Toko "Bepergian"

UPDATE order_items
SET cogs_at_time = p.cogs
FROM products p, transactions t
WHERE order_items.transaction_id = t.id
  AND (order_items.product_id = p.id OR order_items.product_name = p.name)
  AND p.store_id = t.store_id
  AND (order_items.cogs_at_time IS NULL OR order_items.cogs_at_time != p.cogs)
  AND DATE(t.created_at AT TIME ZONE 'Asia/Jakarta') = '2026-09-24'
  AND t.store_id = (SELECT id FROM stores WHERE name ILIKE '%bepergian%' LIMIT 1);
