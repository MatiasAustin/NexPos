-- Add logo_show_background column to saas_settings
ALTER TABLE saas_settings ADD COLUMN IF NOT EXISTS logo_show_background BOOLEAN DEFAULT false;
