CREATE TABLE raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_stock NUMERIC DEFAULT 0,
    last_price_per_unit NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert dummy data
INSERT INTO raw_materials (name, unit, current_stock, last_price_per_unit) VALUES 
('Biji Kopi Arabica', 'kg', 10, 150000),
('Susu Segar', 'liter', 20, 18000),
('Gula Aren', 'kg', 5, 25000),
('Cup Plastik 16oz', 'pcs', 500, 500);

INSERT INTO expenses (description, amount) VALUES 
('Beli Biji Kopi Arabica 5kg', 750000),
('Beli Susu Segar 10 liter', 180000),
('Beli Cup Plastik 1 dus', 250000);
