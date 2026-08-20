-- ===============================================================
-- TAMBAH KOLOM QRIS PADA STORE SETTINGS
-- ===============================================================

ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS qris_image_base64 TEXT;
