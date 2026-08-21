CREATE TABLE kiosk_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    items JSONB NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'draft', 'paid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
