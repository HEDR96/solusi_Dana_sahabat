-- ============================================================================
-- Deteksi nasabah berulang saat input berkas
-- ============================================================================
-- Data nasabah menempel di tiap berkas tanpa tabel master, jadi tidak ada yang
-- mencegah satu orang diinput berkali-kali — termasuk kasus paling merugikan:
-- DUA AGEN BERBEDA mengajukan nasabah yang sama dan dua-duanya mengklaim
-- komisi. Itu tidak akan ketahuan dari layar mana pun saat ini.
--
-- Pengecekan tidak bisa dilakukan dari sisi klien: RLS membuat agen hanya
-- melihat berkasnya sendiri, sehingga duplikat milik agen lain justru yang
-- paling berbahaya dan paling tidak terlihat. Fungsi ini security definer
-- supaya bisa memeriksa lintas-agen, tapi hanya mengembalikan ringkasan
-- seperlunya — bukan data nasabah milik agen lain.

create or replace function dsd_check_customer_nik(p_nik text)
returns table (
  jumlah           int,
  ada_milik_sendiri boolean,
  ada_milik_lain    boolean,
  terakhir_id      text,   -- hanya diisi bila berkas itu boleh dilihat pemanggil
  terakhir_status  text,
  terakhir_tanggal date,
  terakhir_agen    text    -- hanya untuk owner/super-admin/spv pengelola
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role     text := dsd_get_my_role();
  v_agent_id text;
  v_nik      text := nullif(btrim(p_nik), '');
begin
  -- Hanya user aktif yang boleh memakai fungsi ini (dsd_get_my_role() sudah
  -- mengembalikan null untuk akun nonaktif sejak migration 009).
  if v_role is null or v_nik is null or length(v_nik) < 8 then
    return;
  end if;

  select agent_id into v_agent_id from dsd_profiles where id = auth.uid();

  return query
  with cocok as (
    select a.id, a.status, a.input_date, a.agent_id, a.agent_name
    from dsd_applications a
    where nullif(btrim(a.nik), '') = v_nik
  ),
  terakhir as (
    select * from cocok order by input_date desc nulls last, id desc limit 1
  )
  select
    (select count(*)::int from cocok),
    (select exists (select 1 from cocok where agent_id is not distinct from v_agent_id)),
    (select exists (select 1 from cocok where agent_id is distinct from v_agent_id)),
    -- Detail berkas hanya dibuka kalau pemanggil memang berhak melihatnya.
    case
      when v_role in ('owner', 'super-admin') then t.id
      when v_role = 'spv-agen' and t.agent_id in (select dsd_my_managed_agent_ids()) then t.id
      when t.agent_id is not distinct from v_agent_id then t.id
      else null
    end,
    t.status,
    t.input_date,
    case
      when v_role in ('owner', 'super-admin') then t.agent_name
      when v_role = 'spv-agen' and t.agent_id in (select dsd_my_managed_agent_ids()) then t.agent_name
      when t.agent_id is not distinct from v_agent_id then t.agent_name
      else null
    end
  from terakhir t;
end;
$$;

-- anon tidak berkepentingan memanggil ini; cegah dipakai sebagai alat
-- pengecekan "apakah NIK X nasabah di sini" tanpa login.
revoke all on function dsd_check_customer_nik(text) from public, anon;
grant execute on function dsd_check_customer_nik(text) to authenticated;

-- Pencarian per NIK dipakai tiap kali input berkas
create index if not exists idx_applications_nik on dsd_applications (nik);
