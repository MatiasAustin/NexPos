-- Alter expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Operasional';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS raw_material_id UUID REFERENCES raw_materials(id) ON DELETE SET NULL;

UPDATE expenses SET category = 'Operasional' WHERE category IS NULL;

-- Alter products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS operational_cost NUMERIC DEFAULT 3000;

UPDATE products 
SET cogs = COALESCE(cogs, 0) + 3000, 
    operational_cost = 3000 
WHERE operational_cost IS NULL OR operational_cost = 0;
