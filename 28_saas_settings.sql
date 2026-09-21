CREATE TABLE IF NOT EXISTS saas_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name TEXT DEFAULT 'NexPos App',
    app_logo TEXT,
    support_email TEXT DEFAULT 'support@nexpos.local',
    support_phone TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row if empty
INSERT INTO saas_settings (app_name) 
SELECT 'NexPos App' WHERE NOT EXISTS (SELECT 1 FROM saas_settings);

-- RLS for saas_settings
ALTER TABLE saas_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read the settings (so login page can fetch the app name/logo)
DROP POLICY IF EXISTS saas_read ON saas_settings;
CREATE POLICY saas_read ON saas_settings FOR SELECT USING (true);

-- Only super_admins can update
DROP POLICY IF EXISTS saas_update ON saas_settings;
CREATE POLICY saas_update ON saas_settings 
FOR ALL 
USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

GRANT SELECT ON saas_settings TO anon, authenticated;
