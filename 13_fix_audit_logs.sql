-- ===============================================================
-- 13. FIX AUDIT LOGS - DISABLE RLS & AUTO TRIGGER
-- ===============================================================

-- 1. Pastikan tabel audit_logs ada
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id TEXT,
    staff_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Nonaktifkan RLS agar mudah dibaca dari frontend
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;

-- 3. Buat fungsi dan trigger untuk log otomatis di setiap transaksi baru
CREATE OR REPLACE FUNCTION log_transaction_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (action, entity_type, entity_id, staff_id, details)
    VALUES (
        'transaction_created',
        'transactions',
        NEW.id::TEXT,
        NEW.staff_id::TEXT,
        jsonb_build_object(
            'order_reference', NEW.order_reference,
            'amount_due', NEW.amount_due,
            'status', NEW.status
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_transaction ON transactions;
CREATE TRIGGER trg_log_transaction
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION log_transaction_created();

-- 4. Buat fungsi dan trigger untuk log otomatis di setiap refund
CREATE OR REPLACE FUNCTION log_refund_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (action, entity_type, entity_id, staff_id, details)
    VALUES (
        'refund_requested',
        'refunds',
        NEW.id::TEXT,
        NEW.requested_by::TEXT,
        jsonb_build_object(
            'transaction_id', NEW.transaction_id,
            'refund_amount', NEW.refund_amount,
            'reason', NEW.reason
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_refund ON refunds;
CREATE TRIGGER trg_log_refund
AFTER INSERT ON refunds
FOR EACH ROW EXECUTE FUNCTION log_refund_created();

-- 5. Insert log awal agar halaman tidak kosong (opsional, hapus jika tidak mau)
INSERT INTO audit_logs (action, entity_type, entity_id, staff_id, details)
VALUES ('system_initialized', 'system', 'nexpos', 'system', '{"message": "NexPos system audit log initialized"}'::jsonb)
ON CONFLICT DO NOTHING;
