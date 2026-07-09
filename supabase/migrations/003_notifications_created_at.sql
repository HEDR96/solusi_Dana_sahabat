-- Tambah kolom waktu asli agar web bisa menampilkan "x menit lalu" yang akurat
alter table notifications add column if not exists created_at timestamptz default now();
