-- Migrasi: tambah kolom leasing_key ke dsd_rate_tables
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom leasing_key (CMD = CMD Finance built-in)
ALTER TABLE dsd_rate_tables
  ADD COLUMN IF NOT EXISTS leasing_key TEXT NOT NULL DEFAULT 'CMD';

-- 2. Set semua row yang sudah ada ke 'CMD'
UPDATE dsd_rate_tables SET leasing_key = 'CMD'
  WHERE leasing_key IS NULL OR leasing_key = '';

-- 3. Hapus unique constraint lama (nama bisa berbeda, coba keduanya)
ALTER TABLE dsd_rate_tables DROP CONSTRAINT IF EXISTS dsd_rate_tables_product_tipe_key;
ALTER TABLE dsd_rate_tables DROP CONSTRAINT IF EXISTS dsd_rate_tables_pkey;

-- 4. Tambah unique constraint baru: per leasing + product + tipe
ALTER TABLE dsd_rate_tables
  ADD CONSTRAINT dsd_rate_tables_leasing_product_tipe_key
  UNIQUE (leasing_key, product, tipe);
