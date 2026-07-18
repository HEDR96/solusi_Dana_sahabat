-- ============================================================================
-- 011 — Kolom dsd_leasing_partners yang hilang sejak awal
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor.
--
-- Tabel dsd_leasing_partners dibuat di 000_create_all_tables.sql hanya dengan
-- kolom id/name/rate/status. Tapi web (MasterData.jsx, AppContext addLeasing/
-- updateLeasing) dan Android (getLeasingPartners) sudah lama mengasumsikan ada
-- kolom branch/pic/contact/email/products/tenors/min_pinjaman/max_pinjaman/
-- syarat/notes — yang TIDAK PERNAH dibuat migration-nya.
--
-- Akibat: web gagal diam-diam (pakai select('*') — field kosong tanpa error;
-- INSERT/UPDATE leasing baru kemungkinan besar selalu gagal 400 tanpa pernah
-- ketahuan). Android meng-query kolom spesifik → error 400 keras yang baru
-- ketahuan sekarang: "Gagal memuat daftar leasing: HTTP 400: column
-- dsd_leasing_partners.min_pinjaman does not exist".
-- ============================================================================

alter table dsd_leasing_partners
  add column if not exists branch        text,
  add column if not exists pic           text,
  add column if not exists contact       text,
  add column if not exists email         text,
  add column if not exists products      text[],
  add column if not exists tenors        int[],
  add column if not exists min_pinjaman  bigint,
  add column if not exists max_pinjaman  bigint,
  add column if not exists syarat        text,
  add column if not exists notes         text;
