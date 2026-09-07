-- Add min_stock column to raw_materials table
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS min_stock NUMERIC DEFAULT 0;

-- Optional default minimum stock for key items
UPDATE raw_materials SET min_stock = 100 WHERE unit = 'g' AND (min_stock IS NULL OR min_stock = 0);
UPDATE raw_materials SET min_stock = 500 WHERE unit = 'ml' AND (min_stock IS NULL OR min_stock = 0);
UPDATE raw_materials SET min_stock = 20 WHERE unit = 'pcs' AND (min_stock IS NULL OR min_stock = 0);
