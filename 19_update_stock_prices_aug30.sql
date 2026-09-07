-- ============================================================
-- NexPos Migration #19 - Update Bahan Baku & Kategori Pengeluaran
-- OP Kalana Space & Roastery - 30 Agustus 2026
-- ============================================================

-- 1. Tambah kolom category ke tabel expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'operasional';

-- Update pengeluaran lama: jika ada material_id, set kategorinya bahan_baku
UPDATE expenses SET category = 'bahan_baku' WHERE material_id IS NOT NULL AND material_id != '';

-- 2. Tambah kolom operational_cost ke tabel products (biaya operasional per produk)
ALTER TABLE products ADD COLUMN IF NOT EXISTS operational_cost INTEGER DEFAULT 3000;

-- ============================================================
-- 3. UPSERT Bahan Baku dari OP 30 Agustus 2026
-- ============================================================

-- Sesuai request: Buat stok bahan baku menjadi 0 jika tidak ada di dalam daftar update di bawah ini
UPDATE raw_materials SET current_stock = 0;

INSERT INTO raw_materials (name, unit, current_stock, last_price_per_unit, updated_by_name)
VALUES
  ('Robusta Espresso', 'gr', 0, 150, 'Admin Import'),
  ('Arabika Espresso', 'gr', 200, 230, 'Admin Import'),
  ('Arabika Specialty', 'gr', 200, 600, 'Admin Import'),
  ('Susu Oat Side', 'ml', 1000, 32, 'Admin Import'),
  ('Brok Foam', 'ml', 0, 123, 'Admin Import'),
  ('Drip Sirup Strawberry', 'ml', 8100, 132, 'Admin Import'),
  ('Drip Sirup Lychee', 'ml', 1085, 132, 'Admin Import'),
  ('Monin Sirup Mint', 'ml', 100, 200, 'Admin Import'),
  ('Drip Blueberry', 'ml', 380, 132, 'Admin Import'),
  ('Simple Sirup', 'ml', 800, 18, 'Admin Import'),
  ('Gula Aren', 'ml', 800, 38, 'Admin Import'),
  ('Strawberry Jem Goldenfil', 'gr', 400, 50, 'Admin Import'),
  ('Blueberry Jem Goldenfil', 'gr', 800, 50, 'Admin Import'),
  ('Saus Caramel Dafinci', 'ml', 100, 115, 'Admin Import'),
  ('Konsentrat Mango Double Fresh', 'ml', 100, 62, 'Admin Import'),
  ('Konsentrat Orange Double Fresh', 'ml', 500, 62, 'Admin Import'),
  ('Evaporasi F&N', 'ml', 380, 53, 'Admin Import'),
  ('SKM Carnesion', 'gr', 465, 41, 'Admin Import'),
  ('Yakult', 'pcs', 13, 2400, 'Admin Import'),
  ('Galon Cleo', 'ml', 0, 1, 'Admin Import'),
  ('Galon RO', 'ml', 57000, 0, 'Admin Import'),
  ('Powder Coklat Tulip', 'gr', 100, 400, 'Admin Import'),
  ('Powder Taro Fores', 'gr', 670, 60, 'Admin Import'),
  ('Matcha R&D', 'gr', 20, 1200, 'Admin Import'),
  ('Powder Red Velvet Fores', 'gr', 660, 60, 'Admin Import'),
  ('Powder Lemon Tea', 'gr', 250, 30, 'Admin Import'),
  ('Zoda Zero', 'ml', 500, 28, 'Admin Import'),
  ('Paper Filter', 'pcs', 40, 800, 'Admin Import'),
  ('Cup Ice Injec 500ml', 'pcs', 10, 1280, 'Admin Import'),
  ('Sedotan', 'pcs', 145, 100, 'Admin Import'),
  ('Cup Hot', 'pcs', 0, 800, 'Admin Import'),
  ('Lunch Box', 'pcs', 18, 600, 'Admin Import'),
  ('Minyak', 'ml', 0, 23, 'Admin Import'),
  ('Mayo Euro Gurmet', 'gr', 0, 40, 'Admin Import'),
  ('Saus Pedas Euro Gurmet', 'gr', 0, 20, 'Admin Import'),
  ('Saus Mentai Prima Agung', 'gr', 0, 50, 'Admin Import'),
  ('Bumbu Asin Bintang Kembar', 'gr', 0, 80, 'Admin Import'),
  ('Dimsum', 'pcs', 16, 4000, 'Admin Import'),
  ('Kentang Gogo', 'gr', 640, 35, 'Admin Import'),
  ('Yoma Sosis', 'gr', 190, 66, 'Admin Import'),
  ('Nuget Salom', 'gr', 500, 35, 'Admin Import'),
  ('Sendok Plastik', 'pcs', 20, 150, 'Admin Import'),
  ('Drip Sirup Vanilla', 'ml', 940, 132, 'Admin Import'),
  ('Drip Sirup Butterscot', 'ml', 0, 132, 'Admin Import'),
  ('Es Batu', 'gr', 0, 1, 'Admin Import'),
  ('Fresh Milk', 'ml', 1800, 0, 'Admin Import'),
  ('Buah Lychee', 'gr', 0, 0, 'Admin Import')
ON CONFLICT (name) DO UPDATE SET
  current_stock = EXCLUDED.current_stock,
  last_price_per_unit = CASE
    WHEN EXCLUDED.last_price_per_unit > 0 THEN EXCLUDED.last_price_per_unit
    ELSE raw_materials.last_price_per_unit
  END,
  updated_by_name = EXCLUDED.updated_by_name,
  updated_at = NOW();
