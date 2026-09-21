CREATE OR REPLACE FUNCTION register_new_tenant(
    p_owner_name TEXT,
    p_store_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_plan TEXT,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    v_store_id UUID;
BEGIN
    -- 1. Create the store (Tenant)
    INSERT INTO stores (name, owner_id, subscription_plan, status)
    VALUES (p_store_name, p_user_id, p_plan, 'pending_payment')
    RETURNING id INTO v_store_id;

    -- 2. Create the staff profile (Owner role)
    INSERT INTO staff_profiles (id, store_id, name, email, phone, role, is_active)
    VALUES (p_user_id, v_store_id, p_owner_name, p_email, p_phone, 'owner', true);

    -- 3. Initialize default store settings
    INSERT INTO store_settings (store_id) VALUES (v_store_id);

    RETURN v_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
