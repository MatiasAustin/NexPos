-- ===============================================================
-- TAMBAH KOLOM INGREDIENTS PADA PRODUCTS UNTUK HPP MULTI-BAHAN
-- ===============================================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::jsonb;
