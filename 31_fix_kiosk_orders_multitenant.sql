-- Add store_id to kiosk_orders to support multitenancy and prevent shared drafts across stores
ALTER TABLE kiosk_orders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_kiosk_orders_store_id ON kiosk_orders(store_id);
