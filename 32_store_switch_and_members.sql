-- ==============================================================================
-- 32_store_switch_and_members.sql
-- Multi-Store Switch & Store Memberships for NexPos
-- ==============================================================================

-- 1. Create store_members table to support 1 user belonging to multiple stores
CREATE TABLE IF NOT EXISTS store_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff', -- 'owner' or 'staff'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- 2. Enable RLS on store_members
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_members_self ON store_members;
CREATE POLICY store_members_self ON store_members
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS store_members_superadmin ON store_members;
CREATE POLICY store_members_superadmin ON store_members
    FOR ALL USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS store_members_owner ON store_members;
CREATE POLICY store_members_owner ON store_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = store_members.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

-- 3. Populate existing owners into store_members
INSERT INTO store_members (user_id, store_id, role)
SELECT owner_id, id, 'owner'
FROM stores
WHERE owner_id IS NOT NULL
ON CONFLICT (user_id, store_id) DO NOTHING;

-- 4. Populate existing staff into store_members
INSERT INTO store_members (user_id, store_id, role)
SELECT id, store_id, role::text
FROM staff_profiles
WHERE store_id IS NOT NULL
ON CONFLICT (user_id, store_id) DO NOTHING;

-- 5. RPC function to switch active store securely
CREATE OR REPLACE FUNCTION switch_active_store(p_target_store_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_store_name TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum terautentikasi';
    END IF;

    -- Check if user is superadmin
    IF EXISTS (SELECT 1 FROM super_admins WHERE user_id = v_user_id) THEN
        SELECT name INTO v_store_name FROM stores WHERE id = p_target_store_id;
        IF v_store_name IS NULL THEN
            RAISE EXCEPTION 'Toko tidak ditemukan';
        END IF;
        UPDATE staff_profiles SET store_id = p_target_store_id WHERE id = v_user_id;
        RETURN jsonb_build_object('success', true, 'store_id', p_target_store_id, 'store_name', v_store_name, 'role', 'owner');
    END IF;

    -- Check if user is owner of the target store
    IF EXISTS (SELECT 1 FROM stores WHERE id = p_target_store_id AND owner_id = v_user_id) THEN
        v_role := 'owner';
    -- Check if user is registered in store_members
    ELSIF EXISTS (SELECT 1 FROM store_members WHERE user_id = v_user_id AND store_id = p_target_store_id) THEN
        SELECT role INTO v_role FROM store_members WHERE user_id = v_user_id AND store_id = p_target_store_id LIMIT 1;
    -- Check if it is current store in staff_profiles
    ELSIF EXISTS (SELECT 1 FROM staff_profiles WHERE id = v_user_id AND store_id = p_target_store_id) THEN
        SELECT role::text INTO v_role FROM staff_profiles WHERE id = v_user_id AND store_id = p_target_store_id LIMIT 1;
    ELSE
        RAISE EXCEPTION 'Anda tidak memiliki hak akses ke toko ini.';
    END IF;

    SELECT name INTO v_store_name FROM stores WHERE id = p_target_store_id;

    -- Update active store and role in staff_profiles
    UPDATE staff_profiles 
    SET store_id = p_target_store_id, 
        role = COALESCE(v_role::user_role, role)
    WHERE id = v_user_id;

    -- Ensure record in store_members
    INSERT INTO store_members (user_id, store_id, role)
    VALUES (v_user_id, p_target_store_id, COALESCE(v_role, 'staff'))
    ON CONFLICT (user_id, store_id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'store_id', p_target_store_id, 'store_name', v_store_name, 'role', v_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC function to get all stores accessible to current user
CREATE OR REPLACE FUNCTION get_user_stores()
RETURNS TABLE (
    store_id UUID,
    store_name VARCHAR(255),
    role TEXT,
    is_active_store BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_current_store_id UUID;
BEGIN
    v_user_id := auth.uid();
    SELECT store_id INTO v_current_store_id FROM staff_profiles WHERE id = v_user_id;

    RETURN QUERY
    SELECT DISTINCT 
        s.id AS store_id,
        s.name AS store_name,
        COALESCE(sm.role, CASE WHEN s.owner_id = v_user_id THEN 'owner' ELSE 'staff' END) AS role,
        (s.id = v_current_store_id) AS is_active_store
    FROM stores s
    LEFT JOIN store_members sm ON sm.store_id = s.id AND sm.user_id = v_user_id
    LEFT JOIN staff_profiles sp ON sp.id = v_user_id
    WHERE s.owner_id = v_user_id 
       OR sm.user_id = v_user_id 
       OR s.id = sp.store_id
       OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = v_user_id)
    ORDER BY is_active_store DESC, store_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
