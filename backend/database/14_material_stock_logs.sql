-- 14_material_stock_logs.sql
CREATE TABLE IF NOT EXISTS material_stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    delta NUMERIC NOT NULL,
    current_stock NUMERIC NOT NULL,
    price NUMERIC,
    staff_name TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE material_stock_logs DISABLE ROW LEVEL SECURITY;

-- Reload postgrest schema
NOTIFY pgrst, 'reload schema';
