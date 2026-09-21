-- Restore missing shifts that were created without a store_id
UPDATE cash_sessions 
SET store_id = (SELECT id FROM stores WHERE name ILIKE '%Kalana%' LIMIT 1) 
WHERE store_id IS NULL;
