-- ============================================================================
-- Nomor berkas anti-tabrakan (menggantikan hitung-jumlah-baris yang bisa
-- menghasilkan ID sama jika dua agen submit bersamaan).
-- Jalankan SEKALI di Supabase SQL Editor.
-- ============================================================================

create sequence if not exists brk_seq;

-- Mulai dari jumlah berkas sekarang supaya tidak bentrok dengan ID lama
select setval('brk_seq', greatest((select count(*) from applications), 1));

-- Fungsi RPC: dipanggil web & app untuk ambil nomor berkas berikutnya
create or replace function public.next_brk_id() returns text
language sql volatile security definer set search_path = public as $$
  select 'BRK' || lpad((2026000 + nextval('brk_seq'))::text, 7, '0')
$$;

grant execute on function public.next_brk_id() to authenticated;
