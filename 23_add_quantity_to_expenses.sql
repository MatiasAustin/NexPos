-- 23_add_quantity_to_expenses.sql
-- Add quantity and buy_unit columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS quantity NUMERIC;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS buy_unit VARCHAR(50);
