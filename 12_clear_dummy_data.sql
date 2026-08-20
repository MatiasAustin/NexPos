-- ===============================================================
-- 12. HAPUS DATA DUMMY & TAMBAH UKURAN LOGO
-- ===============================================================

-- 1. Tambah Kolom Ukuran Logo & QRIS di Setting
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 60;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS qris_size INTEGER DEFAULT 120;

-- 2. Hapus seluruh data dummy untuk produksi/testing real
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE cash_sessions CASCADE;
