-- 31_add_store_id_to_material_stock_logs.sql

-- Add store_id column
ALTER TABLE material_stock_logs ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Update existing logs based on their material_id
UPDATE material_stock_logs msl
SET store_id = rm.store_id
FROM raw_materials rm
WHERE msl.material_id = rm.id AND msl.store_id IS NULL;

-- If there are any logs where material_id is somehow null or deleted, we can set them to a default store (e.g. Kalana) or leave as null.
DO $$
DECLARE
    kalana_id UUID;
BEGIN
    SELECT id INTO kalana_id FROM stores WHERE name = 'Kalana' LIMIT 1;
    IF kalana_id IS NOT NULL THEN
        UPDATE material_stock_logs SET store_id = kalana_id WHERE store_id IS NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE material_stock_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (just in case)
DROP POLICY IF EXISTS tenant_isolation_policy ON material_stock_logs;
DROP POLICY IF EXISTS superadmin_policy ON material_stock_logs;

-- Apply standard tenant isolation
CREATE POLICY tenant_isolation_policy ON material_stock_logs 
FOR ALL 
USING (store_id = get_current_store_id())
WITH CHECK (store_id = get_current_store_id());

CREATE POLICY superadmin_policy ON material_stock_logs 
FOR ALL 
USING ( EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) )
WITH CHECK ( EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) );

-- Apply trigger to automatically set store_id on insert
DROP TRIGGER IF EXISTS trg_set_store_id_material_stock_logs ON material_stock_logs;
CREATE TRIGGER trg_set_store_id_material_stock_logs BEFORE INSERT ON material_stock_logs FOR EACH ROW EXECUTE FUNCTION set_store_id_on_insert();
