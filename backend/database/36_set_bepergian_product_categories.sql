DO $$
DECLARE
    bepergian_id UUID;
BEGIN
    SELECT id INTO bepergian_id FROM stores WHERE name ILIKE '%Bepergian%' LIMIT 1;
    
    IF bepergian_id IS NOT NULL THEN
        UPDATE products SET category = 'Espresso Based' WHERE store_id = bepergian_id AND name IN ('Creamy Hazelnut Latte', 'Americano', 'Espresso', 'Coffe Latte', 'Kopi Susu Aren', 'Creamy ButterScoth Latte', 'Caramel Latte', 'Vanilla Latte');
        UPDATE products SET category = 'Manual Brew' WHERE store_id = bepergian_id AND name IN ('Pour Over', 'Japanese Iced', 'Tubruk');
        UPDATE products SET category = 'Non Coffee' WHERE store_id = bepergian_id AND name IN ('Matcha Latte', 'Chocolatte');
        UPDATE products SET category = 'Signature Series' WHERE store_id = bepergian_id AND name IN ('Sunset Americano', 'Kopi Susu Nomad');
        UPDATE products SET category = 'Special Series' WHERE store_id = bepergian_id AND name IN ('Montblanc');
    END IF;
END $$;
