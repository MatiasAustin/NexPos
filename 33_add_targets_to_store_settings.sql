-- ==============================================================================
-- 33_add_targets_to_store_settings.sql
-- Add Target Penjualan (Harian, Mingguan, Bulanan) to store_settings
-- ==============================================================================

ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS target_daily NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_weekly NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_monthly NUMERIC DEFAULT 0;
