-- Add discount fields to support manual/event discounts on the cashier side
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE kiosk_orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
