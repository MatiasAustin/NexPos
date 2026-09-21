-- 1. Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subscription_plan VARCHAR(50) DEFAULT 'pro',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create super_admins table for SaaS Owners
CREATE TABLE IF NOT EXISTS super_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert Kalana store (ensure it exists)
DO $$
DECLARE
    kalana_id UUID;
BEGIN
    SELECT id INTO kalana_id FROM stores WHERE name = 'Kalana' LIMIT 1;
    IF kalana_id IS NULL THEN
        INSERT INTO stores (id, name, subscription_plan) 
        VALUES (uuid_generate_v4(), 'Kalana', 'enterprise')
        RETURNING id INTO kalana_id;
    END IF;
    
    -- Use a temporary table to pass this UUID
    CREATE TEMP TABLE IF NOT EXISTS temp_kalana_store (store_id UUID);
    TRUNCATE temp_kalana_store;
    INSERT INTO temp_kalana_store (store_id) VALUES (kalana_id);
END $$;

-- 4. Add store_id to all tables
DO $$
DECLARE
    k_id UUID;
BEGIN
    SELECT store_id INTO k_id FROM temp_kalana_store LIMIT 1;

    -- Add columns
    ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE cash_movements ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE refunds ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

    -- Update existing rows to Kalana store ONLY IF they don't have a store_id yet
    UPDATE staff_profiles SET store_id = k_id WHERE store_id IS NULL;
    UPDATE products SET store_id = k_id WHERE store_id IS NULL;
    UPDATE raw_materials SET store_id = k_id WHERE store_id IS NULL;
    UPDATE expenses SET store_id = k_id WHERE store_id IS NULL;
    UPDATE transactions SET store_id = k_id WHERE store_id IS NULL;
    UPDATE order_items SET store_id = k_id WHERE store_id IS NULL;
    UPDATE payment_methods SET store_id = k_id WHERE store_id IS NULL;
    UPDATE audit_logs SET store_id = k_id WHERE store_id IS NULL;
    UPDATE cash_sessions SET store_id = k_id WHERE store_id IS NULL;
    UPDATE cash_movements SET store_id = k_id WHERE store_id IS NULL;
    UPDATE refunds SET store_id = k_id WHERE store_id IS NULL;
    UPDATE store_settings SET store_id = k_id WHERE store_id IS NULL;

    -- Ensure store_settings has at least 1 row for Kalana
    IF NOT EXISTS (SELECT 1 FROM store_settings WHERE store_id = k_id) THEN
        INSERT INTO store_settings (store_id) VALUES (k_id);
    END IF;
END $$;

-- 5. Helper function to get current user's store_id safely
CREATE OR REPLACE FUNCTION get_current_store_id() RETURNS UUID AS $$
DECLARE
    v_store_id UUID;
BEGIN
    -- Check if user is in super_admins table
    IF EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
        RETURN NULL; -- Superadmin bypass
    END IF;
    
    -- Otherwise, return the store_id from their staff profile
    SELECT store_id INTO v_store_id FROM staff_profiles WHERE id = auth.uid() LIMIT 1;
    RETURN v_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to automatically assign store_id on INSERT
CREATE OR REPLACE FUNCTION set_store_id_on_insert() RETURNS TRIGGER AS $$
DECLARE
    v_store_id UUID;
BEGIN
    v_store_id := get_current_store_id();
    -- If they have a store_id and they didn't specify one, set it automatically
    IF v_store_id IS NOT NULL AND NEW.store_id IS NULL THEN
        NEW.store_id := v_store_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['products', 'raw_materials', 'expenses', 'transactions', 'order_items', 'payment_methods', 'audit_logs', 'cash_sessions', 'cash_movements', 'refunds', 'store_settings'])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_store_id_%I ON %I;', t, t);
        EXECUTE format('CREATE TRIGGER trg_set_store_id_%I BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION set_store_id_on_insert();', t, t);
    END LOOP;
END $$;

-- 7. Enable RLS and Create Policies safely
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['staff_profiles', 'products', 'raw_materials', 'expenses', 'transactions', 'order_items', 'payment_methods', 'audit_logs', 'cash_sessions', 'cash_movements', 'refunds', 'store_settings'])
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', t);
        EXECUTE format('DROP POLICY IF EXISTS superadmin_policy ON %I;', t);
        
        -- Policy for normal users (tenant isolation)
        EXECUTE format('
            CREATE POLICY tenant_isolation_policy ON %I 
            FOR ALL 
            USING (store_id = get_current_store_id())
            WITH CHECK (store_id = get_current_store_id());
        ', t, t);
        
        -- Policy for superadmin (can see everything)
        EXECUTE format('
            CREATE POLICY superadmin_policy ON %I 
            FOR ALL 
            USING ( EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) )
            WITH CHECK ( EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) );
        ', t, t);
    END LOOP;
END $$;

-- Specific policy for stores table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS superadmin_stores_policy ON stores;
CREATE POLICY superadmin_stores_policy ON stores 
FOR ALL 
USING ( EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) )
WITH CHECK ( EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) );

DROP POLICY IF EXISTS tenant_stores_policy ON stores;
CREATE POLICY tenant_stores_policy ON stores 
FOR SELECT 
USING ( id = get_current_store_id() );
