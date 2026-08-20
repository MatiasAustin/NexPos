-- Inventory & Order Items Schema

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cogs DECIMAL(12, 2) NOT NULL DEFAULT 0, -- HPP (Harga Pokok Penjualan)
    stock INTEGER NOT NULL DEFAULT 0,
    image_icon VARCHAR(50), -- Emoji or URL
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL, -- snapshot of name
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(12, 2) NOT NULL, -- snapshot of selling price
    cogs_at_time DECIMAL(12, 2) NOT NULL, -- snapshot of HPP
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: Ensure RLS is disabled if frontend queries directly, but since we have a backend API, 
-- backend uses service_role or backend API endpoints will query this.
-- If the frontend needs to fetch directly via Supabase client, disable RLS:
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
