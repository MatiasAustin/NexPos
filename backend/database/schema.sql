-- NexPos Payment System Schema

CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Failed', 'Expired', 'Cancelled', 'Refunded');
CREATE TYPE cash_movement_type AS ENUM ('sale', 'refund', 'cash_in', 'cash_out', 'withdrawal', 'adjustment', 'expense');
CREATE TYPE session_status AS ENUM ('open', 'closed');

-- Payment Methods Configuration
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'cash', 'qris', 'bank_transfer', etc.
    is_active BOOLEAN DEFAULT true,
    api_credentials JSONB DEFAULT '{}',
    environment VARCHAR(20) DEFAULT 'production',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Core Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_reference VARCHAR(100) UNIQUE NOT NULL,
    amount_due DECIMAL(12, 2) NOT NULL,
    amount_received DECIMAL(12, 2) NOT NULL DEFAULT 0,
    change_given DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status payment_status NOT NULL DEFAULT 'Pending',
    payment_method_id UUID REFERENCES payment_methods(id),
    provider_transaction_id VARCHAR(255),
    payment_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cashier Sessions
CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL, -- Assuming there's a staff/users table somewhere
    terminal_id VARCHAR(100) NOT NULL,
    opening_cash DECIMAL(12, 2) NOT NULL,
    expected_cash DECIMAL(12, 2) NOT NULL,
    actual_cash DECIMAL(12, 2),
    difference DECIMAL(12, 2),
    discrepancy_reason TEXT,
    status session_status NOT NULL DEFAULT 'open',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Immutable Ledger of Cash Movements
CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES cash_sessions(id) NOT NULL,
    staff_id UUID NOT NULL,
    type cash_movement_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL, -- positive for in, negative for out
    reason VARCHAR(255),
    note TEXT,
    transaction_id UUID REFERENCES transactions(id), -- If tied to a sale/refund
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refunds
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) NOT NULL,
    refund_amount DECIMAL(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    requested_by UUID NOT NULL,
    approved_by UUID,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Global Audit Logs for Financial Actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
