DO $$
DECLARE
    bepergian_id UUID;
BEGIN
    SELECT id INTO bepergian_id FROM stores WHERE name ILIKE '%Bepergian%' LIMIT 1;
    
    IF bepergian_id IS NOT NULL THEN
        -- Check if store_settings exists for Bepergian
        IF EXISTS (SELECT 1 FROM store_settings WHERE store_id = bepergian_id) THEN
            UPDATE store_settings 
            SET categories = '["Espresso Based", "Manual Brew", "Non Coffee", "Signature Series", "Special Series"]'::jsonb
            WHERE store_id = bepergian_id;
        ELSE
            INSERT INTO store_settings (store_id, categories) 
            VALUES (bepergian_id, '["Espresso Based", "Manual Brew", "Non Coffee", "Signature Series", "Special Series"]'::jsonb);
        END IF;
    END IF;
END $$;
