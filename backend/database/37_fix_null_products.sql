DO $$
DECLARE
    bepergian_id UUID;
BEGIN
    SELECT id INTO bepergian_id FROM stores WHERE name ILIKE '%Bepergian%' LIMIT 1;
    
    IF bepergian_id IS NOT NULL THEN
        UPDATE products SET store_id = bepergian_id WHERE store_id IS NULL;
    END IF;
END $$;
