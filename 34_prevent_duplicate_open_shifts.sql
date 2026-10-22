-- =========================================================================
-- MIGRATION: 34_prevent_duplicate_open_shifts.sql
-- Deskripsi: Mencegah double shift dalam 1 toko.
-- Hanya boleh ada 1 shift berstatus 'open' per store_id pada tabel cash_sessions.
-- =========================================================================

-- 1. Tutup shift duplikat terdahulu jika ada (sisakan 1 shift open terbaru per toko)
WITH ranked_shifts AS (
    SELECT id, store_id,
           ROW_NUMBER() OVER(PARTITION BY store_id ORDER BY opened_at DESC) as rn
    FROM cash_sessions
    WHERE status = 'open' AND store_id IS NOT NULL
)
UPDATE cash_sessions
SET status = 'closed',
    closed_at = NOW(),
    discrepancy_reason = 'Auto-closed duplicate legacy shift'
WHERE id IN (
    SELECT id FROM ranked_shifts WHERE rn > 1
);

-- 2. Buat Partial Unique Index: Maksimal 1 shift berstatus 'open' per store_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_shift_per_store 
ON cash_sessions (store_id) 
WHERE status = 'open' AND store_id IS NOT NULL;
