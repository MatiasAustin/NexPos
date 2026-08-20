-- NexPos Dummy Products Data
-- Run this in your Supabase SQL Editor to populate the `products` table

INSERT INTO products (name, category, price, cogs, stock, image_icon, is_active)
VALUES 
('Kopi Susu Gula Aren', 'Coffee', 25000, 10000, 50, '☕', true),
('Americano', 'Coffee', 20000, 5000, 100, '☕', true),
('Matcha Latte', 'Non-Coffee', 28000, 12000, 40, '🍵', true),
('Iced Tea', 'Non-Coffee', 12000, 3000, 200, '🍹', true),
('Croissant Butter', 'Pastry', 22000, 10000, 30, '🥐', true),
('Chocolate Chip Cookie', 'Snack', 15000, 6000, 45, '🍪', true),
('Nasi Goreng Spesial', 'Food', 35000, 15000, 25, '🍛', true),
('Mie Goreng Ayam', 'Food', 30000, 12000, 25, '🍜', true);
