-- ===============================================================
-- SCRIPT SIMULASI DATA: BAHAN BAKU, PENGELUARAN, TRANSAKSI 
-- (Harian, Mingguan, Bulanan)
-- ===============================================================

-- 1. Bersihkan Data Simulasi Sebelumnya (Opsional, hapus tanda -- di bawah jika ingin reset tabel)
-- DELETE FROM order_items;
-- DELETE FROM transactions;
-- DELETE FROM expenses;
-- DELETE FROM raw_materials;

-- 2. Tambah Data Bahan Baku
INSERT INTO raw_materials (id, name, unit, current_stock, last_price_per_unit) VALUES 
(uuid_generate_v4(), 'Biji Kopi Arabica (Premium)', 'kg', 12, 185000),
(uuid_generate_v4(), 'Susu Segar Oatmilk', 'liter', 25, 25000),
(uuid_generate_v4(), 'Sirup Karamel', 'botol', 8, 85000),
(uuid_generate_v4(), 'Cup Plastik 16oz', 'pcs', 1000, 500),
(uuid_generate_v4(), 'Gula Aren', 'kg', 10, 25000);

-- 3. Tambah Data Pengeluaran (Bulan Lalu, Minggu Lalu, dan Hari Ini)
INSERT INTO expenses (description, amount, expense_date) VALUES 
-- Bulan Lalu
('Belanja Biji Kopi Arabica 10kg', 1850000, NOW() - INTERVAL '20 days'),
('Bayar Listrik & Air Cafe', 1200000, NOW() - INTERVAL '15 days'),
('Service Mesin Espresso', 500000, NOW() - INTERVAL '18 days'),
-- Minggu Lalu
('Belanja Susu Oatmilk 10 Liter', 250000, NOW() - INTERVAL '5 days'),
('Belanja Gula Aren 5kg', 125000, NOW() - INTERVAL '4 days'),
-- Hari Ini
('Belanja Cup Plastik 1 Dus (1000pcs)', 500000, NOW());

-- 4. Tambah Data Penjualan (Transactions) & Detailnya (Order Items)
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
    -- Ambil UUID Payment Methods (Abaikan jika kosong, pakai yg ada)
    SELECT id INTO cash_method_id FROM payment_methods WHERE type = 'CASH' LIMIT 1;
    SELECT id INTO qris_method_id FROM payment_methods WHERE type = 'QRIS' LIMIT 1;

    -- Fallback jika QRIS/CASH tidak ditemukan tapi ada method lain
    IF cash_method_id IS NULL THEN SELECT id INTO cash_method_id FROM payment_methods LIMIT 1; END IF;
    IF qris_method_id IS NULL THEN SELECT id INTO qris_method_id FROM payment_methods LIMIT 1; END IF;

    -- === BULAN LALU (Transaksi 1 & 2) ===
    INSERT INTO transactions (id, order_reference, amount_due, amount_received, change_given, status, payment_method_id, created_at)
    VALUES 
    (trx_id_1, 'TRX-101-BLNLALU', 50000, 50000, 0, 'Paid', qris_method_id, NOW() - INTERVAL '25 days'),
    (trx_id_2, 'TRX-102-BLNLALU', 35000, 50000, 15000, 'Paid', cash_method_id, NOW() - INTERVAL '20 days');

    INSERT INTO order_items (transaction_id, product_name, quantity, price_at_time, cogs_at_time)
    VALUES 
    (trx_id_1, 'Kopi Susu Aren', 2, 25000, 12000),
    (trx_id_2, 'Oatmilk Latte', 1, 35000, 18000);

    -- === MINGGU LALU (Transaksi 3) ===
    INSERT INTO transactions (id, order_reference, amount_due, amount_received, change_given, status, payment_method_id, created_at)
    VALUES 
    (trx_id_3, 'TRX-201-MNGLALU', 100000, 100000, 0, 'Paid', qris_method_id, NOW() - INTERVAL '6 days');

    INSERT INTO order_items (transaction_id, product_name, quantity, price_at_time, cogs_at_time)
    VALUES 
    (trx_id_3, 'Kopi Susu Aren', 4, 25000, 12000);

    -- === HARI INI (Transaksi 4 & 5) ===
    INSERT INTO transactions (id, order_reference, amount_due, amount_received, change_given, status, payment_method_id, created_at)
    VALUES 
    (trx_id_4, 'TRX-301-HRINI', 35000, 35000, 0, 'Paid', qris_method_id, NOW() - INTERVAL '2 hours'),
    (trx_id_5, 'TRX-302-HRINI', 75000, 100000, 25000, 'Paid', cash_method_id, NOW() - INTERVAL '30 minutes');

    INSERT INTO order_items (transaction_id, product_name, quantity, price_at_time, cogs_at_time)
    VALUES 
    (trx_id_4, 'Oatmilk Latte', 1, 35000, 18000),
    (trx_id_5, 'Kopi Susu Aren', 3, 25000, 12000);

END $$;
