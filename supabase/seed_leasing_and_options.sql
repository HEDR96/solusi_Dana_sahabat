-- ============================================================================
-- STEP 1: Tambah kolom yang belum ada di dsd_leasing_partners
-- (Tabel awal hanya punya id, name, rate, status)
-- ============================================================================
ALTER TABLE dsd_leasing_partners
  ADD COLUMN IF NOT EXISTS branch       text,
  ADD COLUMN IF NOT EXISTS pic          text,
  ADD COLUMN IF NOT EXISTS contact      text,
  ADD COLUMN IF NOT EXISTS email        text,
  ADD COLUMN IF NOT EXISTS products     text,
  ADD COLUMN IF NOT EXISTS tenors       text,
  ADD COLUMN IF NOT EXISTS min_pinjaman bigint,
  ADD COLUMN IF NOT EXISTS max_pinjaman bigint,
  ADD COLUMN IF NOT EXISTS syarat       text,
  ADD COLUMN IF NOT EXISTS notes        text;

-- Ubah tipe rate jadi text agar bisa simpan "1.5%" (string dari brosur)
-- Jika rate sudah numeric, skip baris ini dan sesuaikan value di INSERT
ALTER TABLE dsd_leasing_partners
  ALTER COLUMN rate TYPE text USING rate::text;

-- ============================================================================
-- STEP 2: Hapus data lama lalu insert CMD Finance Medan
-- ============================================================================
DELETE FROM dsd_leasing_partners;

INSERT INTO dsd_leasing_partners (name, branch, pic, contact, email, products, rate, tenors, min_pinjaman, max_pinjaman, status, syarat, notes) VALUES
('CMD Finance', 'Medan', '', '', '', 'Motor & Mobil (BPKB)', '0', '6,12,18,24,30,36,48', 5000000, 200000000, 'aktif', 'KTP, KK, BPKB/STNK', '');

-- ============================================================================
-- STEP 3: Seed dsd_master_options — doc_type
-- ============================================================================
INSERT INTO dsd_master_options (category, value, label, sort_order, active) VALUES
('doc_type', 'KTP',            'KTP',               1, true),
('doc_type', 'KK',             'Kartu Keluarga',    2, true),
('doc_type', 'STNK',           'STNK',              3, true),
('doc_type', 'BPKB',           'BPKB',              4, true),
('doc_type', 'Slip Gaji',      'Slip Gaji',         5, true),
('doc_type', 'Foto Unit',      'Foto Unit',         6, true),
('doc_type', 'Dok. Pendukung', 'Dokumen Pendukung', 7, true),
('doc_type', 'NPWP',           'NPWP',              8, true),
('doc_type', 'Rekening Koran', 'Rekening Koran',    9, true),
('doc_type', 'SPT Tahunan',    'SPT Tahunan',      10, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Seed dsd_master_options — bank
-- ============================================================================
INSERT INTO dsd_master_options (category, value, label, sort_order, active) VALUES
('bank', 'BCA',     'BCA',            1, true),
('bank', 'BNI',     'BNI',            2, true),
('bank', 'BRI',     'BRI',            3, true),
('bank', 'Mandiri', 'Bank Mandiri',   4, true),
('bank', 'BSI',     'BSI',            5, true),
('bank', 'BTPN',    'BTPN',           6, true),
('bank', 'Danamon', 'Bank Danamon',   7, true),
('bank', 'Permata', 'Bank Permata',   8, true),
('bank', 'CIMB',    'CIMB Niaga',     9, true),
('bank', 'Jenius',  'Jenius (BTPN)', 10, true),
('bank', 'Jago',    'Bank Jago',     11, true),
('bank', 'Neo',     'Bank Neo',      12, true)
ON CONFLICT DO NOTHING;
