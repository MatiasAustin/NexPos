-- 32_fix_superadmin_rls_and_null_stores.sql

-- 1. Fix get_current_store_id() so it never returns NULL for Super Admin.
-- This ensures that when Super Admin inserts a record, it gets stamped with their current active store.
CREATE OR REPLACE FUNCTION get_current_store_id() RETURNS UUID AS $$
DECLARE
    v_store_id UUID;
BEGIN
    SELECT store_id INTO v_store_id FROM staff_profiles WHERE id = auth.uid() LIMIT 1;
    RETURN v_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the superadmin_policy from all tenant tables so Super Admin only sees their active store in standard dashboards.
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['products', 'raw_materials', 'expenses', 'transactions', 'order_items', 'payment_methods', 'audit_logs', 'cash_sessions', 'cash_movements', 'refunds', 'store_settings', 'material_stock_logs'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS superadmin_policy ON %I;', t);
    END LOOP;
END $$;

-- 3. Fix records that currently have store_id = NULL
DO $$
DECLARE
    kalana_id UUID;
    t TEXT;
BEGIN
    -- We assume Kalana is the primary store for existing unstamped records
    SELECT id INTO kalana_id FROM stores WHERE name = 'Kalana' LIMIT 1;
    
    IF kalana_id IS NOT NULL THEN
        FOR t IN 
            SELECT unnest(ARRAY['products', 'raw_materials', 'expenses', 'transactions', 'order_items', 'payment_methods', 'audit_logs', 'cash_sessions', 'cash_movements', 'refunds', 'store_settings', 'material_stock_logs', 'staff_profiles'])
        LOOP
            EXECUTE format('UPDATE %I SET store_id = %L WHERE store_id IS NULL;', t, kalana_id);
        END LOOP;
    END IF;
END $$;

-- 4. Re-enable RLS on the tables that had it disabled in schema files (like material_stock_logs, products, order_items)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_stock_logs ENABLE ROW LEVEL SECURITY;

-- Ensure the standard tenant isolation policy exists for material_stock_logs
DROP POLICY IF EXISTS tenant_isolation_policy ON material_stock_logs;
CREATE POLICY tenant_isolation_policy ON material_stock_logs 
FOR ALL 
USING (store_id = get_current_store_id())
WITH CHECK (store_id = get_current_store_id());
