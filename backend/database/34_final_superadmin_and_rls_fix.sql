-- 1. Remove regular owners from super_admins (only keep tiasaustin32@gmail.com)
DO $$
DECLARE
    super_admin_id UUID;
BEGIN
    SELECT id INTO super_admin_id FROM auth.users WHERE email = 'tiasaustin32@gmail.com' LIMIT 1;
    IF super_admin_id IS NOT NULL THEN
        DELETE FROM public.super_admins WHERE user_id != super_admin_id;
    END IF;
END $$;

-- 2. Clean up RLS policies so even super admin data is properly isolated by store
DO $$
DECLARE
    kalana_id UUID;
    t TEXT;
BEGIN
    SELECT id INTO kalana_id FROM stores WHERE name = 'Kalana' LIMIT 1;
    
    FOR t IN 
        SELECT unnest(ARRAY['products', 'raw_materials', 'expenses', 'transactions', 'order_items', 'payment_methods', 'audit_logs', 'cash_sessions', 'cash_movements', 'refunds', 'store_settings', 'material_stock_logs', 'staff_profiles'])
    LOOP
        -- Drop the old bypass policy
        EXECUTE format('DROP POLICY IF EXISTS superadmin_policy ON %I;', t);
        
        -- Migrate any floating (NULL) data to Kalana
        IF kalana_id IS NOT NULL AND t != 'staff_profiles' THEN
            EXECUTE format('UPDATE %I SET store_id = %L WHERE store_id IS NULL;', t, kalana_id);
        END IF;
    END LOOP;
END $$;
