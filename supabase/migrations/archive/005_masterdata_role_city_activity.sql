-- ============================================================================
-- Master data lanjutan: role (+deskripsi kegunaan), kota, jenis & hasil aktivitas
-- Semua dropdown web+APK kini dari DB, tidak ada hardcode.
-- Jalankan SEKALI di Supabase SQL Editor (setelah 004).
-- ============================================================================

-- Kolom label: teks tampilan (value = kunci yang disimpan di data)
alter table master_options add column if not exists label text;

-- ── Kota ────────────────────────────────────────────────────────────────────
insert into master_options (category, value, sort) values
  ('city', 'Jakarta', 1), ('city', 'Bandung', 2), ('city', 'Surabaya', 3),
  ('city', 'Medan', 4), ('city', 'Semarang', 5), ('city', 'Makassar', 6),
  ('city', 'Palembang', 7), ('city', 'Yogyakarta', 8), ('city', 'Denpasar', 9),
  ('city', 'Balikpapan', 10)
on conflict (category, value) do nothing;

-- ── Jenis aktivitas (value = kunci di kolom agent_activities.type) ──────────
insert into master_options (category, value, label, sort) values
  ('activity_type', 'kunjungan-dealer', 'Kunjungan Dealer', 1),
  ('activity_type', 'follow-up',        'Follow Up Nasabah', 2),
  ('activity_type', 'cold-call',        'Cold Call / Telepon', 3),
  ('activity_type', 'referral',         'Referral Nasabah', 4),
  ('activity_type', 'survey-lokasi',    'Survey Lokasi', 5),
  ('activity_type', 'networking',       'Networking / Event', 6)
on conflict (category, value) do nothing;

-- ── Hasil aktivitas ─────────────────────────────────────────────────────────
insert into master_options (category, value, label, sort) values
  ('activity_outcome', 'prospek-baru',        'Prospek Baru', 1),
  ('activity_outcome', 'follow-up-lanjutan',  'Perlu Follow Up', 2),
  ('activity_outcome', 'menghasilkan-berkas', 'Menghasilkan Berkas', 3),
  ('activity_outcome', 'tidak-berhasil',      'Tidak Berhasil', 4)
on conflict (category, value) do nothing;

-- ── Role (value = kunci di profiles.role, label = tampilan) ────────────────
-- CATATAN: menambah role baru di sini hanya menambah pilihan tampilan.
-- Hak akses role tetap diatur di kode (src/data/permissions.js) demi keamanan.
insert into master_options (category, value, label, sort) values
  ('role', 'owner',       'Owner', 1),
  ('role', 'super-admin', 'Super Admin', 2),
  ('role', 'admin',       'Admin / Back Office', 3),
  ('role', 'spv-agen',    'Supervisor Agen', 4),
  ('role', 'agen',        'Agen', 5),
  ('role', 'surveyor',    'Surveyor', 6),
  ('role', 'finance',     'Finance', 7)
on conflict (category, value) do nothing;

-- ── Kegunaan / deskripsi per role (kategori roleperm:<role>) ────────────────
insert into master_options (category, value, sort) values
  ('roleperm:owner', 'Semua akses sistem tanpa batasan', 1),
  ('roleperm:owner', 'Kelola semua user & role', 2),
  ('roleperm:owner', 'Akses semua laporan & data', 3),
  ('roleperm:owner', 'Kelola pengaturan sistem', 4),

  ('roleperm:super-admin', 'Semua akses sistem', 1),
  ('roleperm:super-admin', 'Kelola user & role', 2),
  ('roleperm:super-admin', 'Akses semua laporan', 3),

  ('roleperm:admin', 'Input & kelola berkas', 1),
  ('roleperm:admin', 'Kelola agen & leasing', 2),
  ('roleperm:admin', 'Update status pengajuan', 3),
  ('roleperm:admin', 'Lihat semua laporan', 4),

  ('roleperm:spv-agen', 'Lihat agen di bawah supervisinya', 1),
  ('roleperm:spv-agen', 'Monitor berkas & komisi agen binaan', 2),
  ('roleperm:spv-agen', 'Lihat aktivitas agen supervised', 3),
  ('roleperm:spv-agen', 'Laporan filtered per agen binaan', 4),

  ('roleperm:agen', 'Input berkas pengajuan', 1),
  ('roleperm:agen', 'Lihat berkas & komisi sendiri', 2),
  ('roleperm:agen', 'Catat aktivitas harian', 3),

  ('roleperm:surveyor', 'Lihat jadwal survey', 1),
  ('roleperm:surveyor', 'Update hasil survey', 2),

  ('roleperm:finance', 'Kelola pembayaran komisi', 1),
  ('roleperm:finance', 'Lihat laporan keuangan', 2)
on conflict (category, value) do nothing;
