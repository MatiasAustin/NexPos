-- Update Stock Opname & Prices (30 Agustus 2026)
-- Script ini akan mencari nama bahan baku yang mirip dan mengupdate stok serta harga per-unit (HPP).
-- Pastikan kamu menjalankan ini di menu SQL Editor pada Supabase.

UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 150, unit = 'g' WHERE name ILIKE '%Robusta espresso%';
UPDATE raw_materials SET current_stock = 200, last_price_per_unit = 230, unit = 'g' WHERE name ILIKE '%Arabika espresso%';
UPDATE raw_materials SET current_stock = 200, last_price_per_unit = 600, unit = 'g' WHERE name ILIKE '%Arabika specialty%';
UPDATE raw_materials SET current_stock = 1000, last_price_per_unit = 32, unit = 'ml' WHERE name ILIKE '%Susu oat side%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 123, unit = 'ml' WHERE name ILIKE '%Brok foam%';
UPDATE raw_materials SET current_stock = 8100, last_price_per_unit = 131.57, unit = 'ml' WHERE name ILIKE '%sirup strawberry%';
UPDATE raw_materials SET current_stock = 1085, last_price_per_unit = 131.57, unit = 'ml' WHERE name ILIKE '%sirup lychee%';
UPDATE raw_materials SET current_stock = 100, last_price_per_unit = 200, unit = 'ml' WHERE name ILIKE '%sirup mint%';
UPDATE raw_materials SET current_stock = 380, last_price_per_unit = 131.57, unit = 'ml' WHERE name ILIKE '%Drip blueberry%';
UPDATE raw_materials SET current_stock = 800, last_price_per_unit = 18, unit = 'ml' WHERE name ILIKE '%Simple sirup%';
UPDATE raw_materials SET current_stock = 800, last_price_per_unit = 38, unit = 'ml' WHERE name ILIKE '%Gula aren%';
UPDATE raw_materials SET current_stock = 400, last_price_per_unit = 50, unit = 'g' WHERE name ILIKE '%Strawberry jem goldenfil%';
UPDATE raw_materials SET current_stock = 800, last_price_per_unit = 50, unit = 'g' WHERE name ILIKE '%Blueberry jem goldenfil%';
UPDATE raw_materials SET current_stock = 100, last_price_per_unit = 115, unit = 'ml' WHERE name ILIKE '%Saus caramel dafinci%';
UPDATE raw_materials SET current_stock = 100, last_price_per_unit = 61.53, unit = 'ml' WHERE name ILIKE '%mango double fresh%';
UPDATE raw_materials SET current_stock = 500, last_price_per_unit = 61.53, unit = 'ml' WHERE name ILIKE '%orange double fresh%';
UPDATE raw_materials SET current_stock = 380, last_price_per_unit = 52.63, unit = 'ml' WHERE name ILIKE '%Evaporasi f&n%';
UPDATE raw_materials SET current_stock = 465, last_price_per_unit = 40.54, unit = 'g' WHERE name ILIKE '%Skm carnesion%';
UPDATE raw_materials SET current_stock = 13, last_price_per_unit = 2400, unit = 'pcs' WHERE name ILIKE '%Yakult%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 1.15, unit = 'ml' WHERE name ILIKE '%Galon cleo%';
UPDATE raw_materials SET current_stock = 57000, last_price_per_unit = 0.368, unit = 'ml' WHERE name ILIKE '%Galon RO%';
UPDATE raw_materials SET current_stock = 100, last_price_per_unit = 400, unit = 'g' WHERE name ILIKE '%Powder coklat tulip%';
UPDATE raw_materials SET current_stock = 670, last_price_per_unit = 60, unit = 'g' WHERE name ILIKE '%Powder taro fores%';
UPDATE raw_materials SET current_stock = 20, last_price_per_unit = 1200, unit = 'g' WHERE name ILIKE '%Macha R&D%';
UPDATE raw_materials SET current_stock = 660, last_price_per_unit = 60, unit = 'g' WHERE name ILIKE '%Powder red velveat fores%';
UPDATE raw_materials SET current_stock = 250, last_price_per_unit = 30, unit = 'g' WHERE name ILIKE '%Powder lemon tea%';
UPDATE raw_materials SET current_stock = 500, last_price_per_unit = 28, unit = 'ml' WHERE name ILIKE '%Zoda zero%';
UPDATE raw_materials SET current_stock = 40, last_price_per_unit = 800, unit = 'pcs' WHERE name ILIKE '%Paper filter%';
UPDATE raw_materials SET current_stock = 10, last_price_per_unit = 1280, unit = 'pcs' WHERE name ILIKE '%Cup ice injec%';
UPDATE raw_materials SET current_stock = 145, last_price_per_unit = 100, unit = 'pcs' WHERE name ILIKE '%Sedotan%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 800, unit = 'pcs' WHERE name ILIKE '%Cup hot%';
UPDATE raw_materials SET current_stock = 18, last_price_per_unit = 600, unit = 'pcs' WHERE name ILIKE '%Lunch box%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 22.5, unit = 'ml' WHERE name ILIKE '%Minyak%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 40, unit = 'g' WHERE name ILIKE '%Mayo euro gurmet%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 20, unit = 'g' WHERE name ILIKE '%Saus pedah euro gurmet%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 50, unit = 'g' WHERE name ILIKE '%Saus mentai prima agung%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 80, unit = 'g' WHERE name ILIKE '%Bumbu asin bintang kembar%';
UPDATE raw_materials SET current_stock = 16, last_price_per_unit = 4000, unit = 'pcs' WHERE name ILIKE '%Dimsum%';
UPDATE raw_materials SET current_stock = 640, last_price_per_unit = 35, unit = 'g' WHERE name ILIKE '%Kentang gogo%';
UPDATE raw_materials SET current_stock = 190, last_price_per_unit = 66, unit = 'g' WHERE name ILIKE '%Yoma sosis%';
UPDATE raw_materials SET current_stock = 500, last_price_per_unit = 35, unit = 'g' WHERE name ILIKE '%Nuget salom%';
UPDATE raw_materials SET current_stock = 20, last_price_per_unit = 150, unit = 'pcs' WHERE name ILIKE '%Sendok plastik%';
UPDATE raw_materials SET current_stock = 940, last_price_per_unit = 131.57, unit = 'ml' WHERE name ILIKE '%sirup vanilla%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 131.57, unit = 'ml' WHERE name ILIKE '%sirup buterscot%';
UPDATE raw_materials SET current_stock = 0, last_price_per_unit = 1, unit = 'g' WHERE name ILIKE '%Es batu%';

-- Khusus untuk item yang tidak ada harganya di daftar kedua tapi ada stok opname-nya:
UPDATE raw_materials SET current_stock = 1800 WHERE name ILIKE '%Fresh milk%';
UPDATE raw_materials SET current_stock = 0 WHERE name ILIKE '%Buah lychee%';
