-- Tabel push messages untuk kirim notifikasi dari web ke APK
CREATE TABLE IF NOT EXISTS dsd_push_messages (
    id BIGSERIAL PRIMARY KEY,
    target_user_id UUID,              -- NULL = broadcast ke semua
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Index untuk polling APK: ambil pesan belum dikirim untuk user tertentu / broadcast
CREATE INDEX IF NOT EXISTS idx_push_messages_created ON dsd_push_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_messages_target  ON dsd_push_messages (target_user_id);

-- RLS
ALTER TABLE dsd_push_messages ENABLE ROW LEVEL SECURITY;

-- Owner/admin bisa insert
DROP POLICY IF EXISTS "push_insert" ON dsd_push_messages;
CREATE POLICY "push_insert" ON dsd_push_messages
    FOR INSERT WITH CHECK (true);

-- Semua user login bisa baca (APK polling, difilter di app-level)
DROP POLICY IF EXISTS "push_select" ON dsd_push_messages;
CREATE POLICY "push_select" ON dsd_push_messages
    FOR SELECT USING (auth.role() = 'authenticated');
