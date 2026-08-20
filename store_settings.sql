CREATE TABLE store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo_base64 TEXT,
    cafe_name TEXT,
    receipt_footer TEXT,
    wifi_password TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO store_settings (logo_base64, cafe_name, receipt_footer, wifi_password) 
VALUES (NULL, 'My Cafe', 'Terima kasih atas kunjungan Anda!', 'wifi: cafe123');
