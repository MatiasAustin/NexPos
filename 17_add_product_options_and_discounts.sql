-- Menambahkan fitur diskon dan opsi produk
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS options_config JSONB DEFAULT '[]'::jsonb;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS modifiers JSONB DEFAULT '[]'::jsonb;