-- ===============================================================
-- 1. PASTIKAN TABEL BAHAN BAKU & PENGELUARAN ADA (Dan Disable RLS)
-- ===============================================================
CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_stock NUMERIC DEFAULT 0,
    last_price_per_unit NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pastikan RLS dimatikan agar frontend anon key bisa akses (Penting jika Anda pakai template default Supabase)
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;

-- ===============================================================
-- 2. BERSIHKAN DATA SIMULASI SEBELUMNYA (Agar tidak numpuk/error)
-- ===============================================================
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE raw_materials CASCADE;

-- ===============================================================
-- 3. INSERT DATA BAHAN BAKU BARU
-- ===============================================================
INSERT INTO raw_materials (id, name, unit, current_stock, last_price_per_unit) VALUES 
(uuid_generate_v4(), 'Biji Kopi Arabica (Premium)', 'kg', 12, 185000),
(uuid_generate_v4(), 'Susu Segar Oatmilk', 'liter', 25, 25000),
(uuid_generate_v4(), 'Sirup Karamel', 'botol', 8, 85000),
(uuid_generate_v4(), 'Cup Plastik 16oz', 'pcs', 1000, 500),
(uuid_generate_v4(), 'Gula Aren', 'kg', 10, 25000);

-- ===============================================================
-- 4. INSERT DATA PENGELUARAN (Bulan Lalu, Minggu Lalu, dan Hari Ini)
-- ===============================================================
INSERT INTO expenses (description, amount, expense_date) VALUES 
('Belanja Biji Kopi Arabica 10kg', 1850000, NOW() - INTERVAL '20 days'),
('Bayar Listrik & Air Cafe', 1200000, NOW() - INTERVAL '15 days'),
('Service Mesin Espresso', 500000, NOW() - INTERVAL '18 days'),
('Belanja Susu Oatmilk 10 Liter', 250000, NOW() - INTERVAL '5 days'),
('Belanja Gula Aren 5kg', 125000, NOW() - INTERVAL '4 days'),
('Belanja Cup Plastik 1 Dus (1000pcs)', 500000, NOW());

-- ===============================================================
-- 5. INSERT DATA PENJUALAN (TRANSACTIONS)
-- ===============================================================
DO $$
DECLARE
    cash_method_id UUID;
    qris_method_id UUID;
    trx_id_1 UUID := uuid_generate_v4();
    trx_id_2 UUID := uuid_generate_v4();
    trx_id_3 UUID := uuid_generate_v4();
    trx_id_4 UUID := uuid_generate_v4();
    trx_id_5 UUID := uuid_generate_v4();
BEGIN
    -- Ambil UUID Payment Methods, pastikan payment_methods memiliki data
    SELECT id INTO cash_method_id FROM payment_methods WHERE type = 'CASH' LIMIT 1;
    SELECT id INTO qris_method_id FROM payment_methods WHERE type = 'QRIS' LIMIT 1;

    IF cash_method_id IS NULL THEN 
       INSERT INTO payment_methods (name, type) VALUES ('Tunai', 'CASH') RETURNING id INTO cash_method_id;
    END IF;
    IF qris_method_id IS NULL THEN 
       INSERT INTO payment_methods (name, type) VALUES ('QRIS', 'QRIS') RETURNING id INTO qris_method_id;
    END IF;

    -- === BULAN LALU ===
    INSERT INTO transactions (id, order_reference, amount_due, amount_received, change_given, status, payment_method_id, created_at)
    VALUES 
    (trx_id_1, 'TRX-101-BLNLALU', 50000, 50000, 0, 'Paid', qris_method_id, NOW() - INTERVAL '25 days'),
    (trx_id_2, 'TRX-102-BLNLALU', 35000, 50000, 15000, 'Paid', cash_method_id, NOW() - INTERVAL '20 days');

    INSERT INTO order_items (transaction_id, product_name, quantity, price_at_time, cogs_at_time)
    VALUES 
    (trx_id_1, 'Kopi Susu Aren', 2, 25000, 12000),
    (trx_id_2, 'Oatmilk Latte', 1, 35000, 18000);

    -- === MINGGU LALU ===
    INSERT INTO transactions (id, order_reference, amount_due, amount_received, change_given, status, payment_method_id, created_at)
    VALUES 
    (trx_id_3, 'TRX-201-MNGLALU', 100000, 100000, 0, 'Paid', qris_method_id, NOW() - INTERVAL '6 days');

    INSERT INTO order_items (transaction_id, product_name, quantity, price_at_time, cogs_at_time)
    VALUES 
    (trx_id_3, 'Kopi Susu Aren', 4, 25000, 12000);

    -- === HARI INI ===
    INSERT INTO transactions (id, order_reference, amount_due, amount_received, change_given, status, payment_method_id, created_at)
    VALUES 
    (trx_id_4, 'TRX-301-HRINI', 35000, 35000, 0, 'Paid', qris_method_id, NOW() - INTERVAL '2 hours'),
    (trx_id_5, 'TRX-302-HRINI', 75000, 100000, 25000, 'Paid', cash_method_id, NOW() - INTERVAL '30 minutes');

    INSERT INTO order_items (transaction_id, product_name, quantity, price_at_time, cogs_at_time)
    VALUES 
    (trx_id_4, 'Oatmilk Latte', 1, 35000, 18000),
    (trx_id_5, 'Kopi Susu Aren', 3, 25000, 12000);

END $$;
