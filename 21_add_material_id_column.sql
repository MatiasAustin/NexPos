-- Optional sync: Add material_id as an alias to raw_material_id on expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES raw_materials(id) ON DELETE SET NULL;
UPDATE expenses SET material_id = raw_material_id WHERE material_id IS NULL AND raw_material_id IS NOT NULL;
