-- Auth & Role Schema for NexPos

CREATE TYPE user_role AS ENUM ('owner', 'staff');

-- 1. Create Staff Profiles table linking to Supabase auth.users
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Modify existing tables to link staff_id to staff_profiles instead of arbitrary UUIDs
-- (Assuming the tables are empty right now, otherwise we'd need to migrate data carefully)
ALTER TABLE cash_sessions 
    DROP COLUMN staff_id,
    ADD COLUMN staff_id UUID REFERENCES staff_profiles(id);

ALTER TABLE cash_movements 
    DROP COLUMN staff_id,
    ADD COLUMN staff_id UUID REFERENCES staff_profiles(id);

ALTER TABLE audit_logs 
    DROP COLUMN staff_id,
    ADD COLUMN staff_id UUID REFERENCES staff_profiles(id);

-- Optional: Initial Owner Account Seed
-- You still need to create the user in Supabase Auth first, then link their ID here.
