-- Migrasi: tambah kolom last_login ke dsd_profiles
-- Jalankan di Supabase SQL Editor

ALTER TABLE dsd_profiles
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
