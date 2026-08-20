-- ===============================================================
-- TAMBAH KOLOM WIFI NAME, TAX ENABLED, TAX RATE
-- ===============================================================

ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS wifi_name TEXT,
ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0;
