-- ============================================================================
-- 1) MASTER DATA: opsi dropdown dikelola owner dari dashboard (tidak hardcode)
-- 2) LAMAR JADI AGEN: form publik di landing page → agent status 'nonaktif'
-- Jalankan SEKALI di Supabase SQL Editor.
-- ============================================================================

-- ── Master options ──────────────────────────────────────────────────────────
create table if not exists master_options (
  id       bigint generated always as identity primary key,
  category text not null,          -- unit_type | tenor | bank | payment_method
  value    text not null,
  sort     int  default 0,
  active   boolean default true,
  unique (category, value)
);

alter table master_options enable row level security;

drop policy if exists master_select on master_options;
create policy master_select on master_options for select
  to anon, authenticated using (true);   -- dibaca app, web, dan landing page

drop policy if exists master_write on master_options;
create policy master_write on master_options for all to authenticated
  using (get_my_role() in ('owner','super-admin','admin'))
  with check (get_my_role() in ('owner','super-admin','admin'));

-- Seed nilai awal (sesuai yang selama ini hardcode)
insert into master_options (category, value, sort) values
  ('unit_type', 'Motor', 1), ('unit_type', 'Mobil', 2), ('unit_type', 'Sertifikat', 3),
  ('tenor', '6', 1), ('tenor', '12', 2), ('tenor', '18', 3),
  ('tenor', '24', 4), ('tenor', '36', 5), ('tenor', '48', 6),
  ('bank', 'BCA', 1), ('bank', 'BRI', 2), ('bank', 'BNI', 3),
  ('bank', 'Mandiri', 4), ('bank', 'BSI', 5),
  ('payment_method', 'Transfer Bank', 1), ('payment_method', 'Cash', 2),
  ('payment_method', 'QRIS', 3), ('payment_method', 'Cek', 4)
on conflict (category, value) do nothing;

-- ── Lamar jadi agen (dipanggil tanpa login dari landing page) ───────────────
create or replace function public.apply_as_agent(
  p_name text, p_phone text, p_email text,
  p_city text, p_address text, p_nik text
) returns text
language plpgsql volatile security definer set search_path = public as $$
declare
  new_id text;
begin
  if coalesce(trim(p_name), '')  = '' then raise exception 'Nama wajib diisi';  end if;
  if coalesce(trim(p_phone), '') = '' then raise exception 'No. HP wajib diisi'; end if;
  if length(coalesce(p_nik, '')) <> 16   then raise exception 'NIK harus 16 digit'; end if;

  -- Tolak duplikat pendaftaran dengan NIK/HP sama
  if exists (select 1 from agents where nik = p_nik or phone = p_phone) then
    raise exception 'NIK atau No. HP sudah terdaftar';
  end if;

  select 'AGT' || lpad((count(*) + 1)::text, 3, '0') into new_id from agents;

  insert into agents (id, name, phone, email, city, address, nik, status,
                      join_date, target, total_approve, total_reject, total_berkas, notes)
  values (new_id, trim(p_name), trim(p_phone), trim(p_email), trim(p_city),
          trim(p_address), p_nik, 'nonaktif',
          to_char(now(), 'YYYY-MM-DD'), 10, 0, 0, 0,
          'Pendaftaran mandiri dari landing page — menunggu aktivasi owner');

  insert into notifications (type, message, time_ago, read, link, created_at)
  values ('agen-baru', 'Lamaran agen baru: ' || trim(p_name) || ' (' || coalesce(trim(p_city), '-') || ') — menunggu aktivasi',
          'Baru saja', false, '/agents', now());

  return new_id;
end $$;

grant execute on function public.apply_as_agent(text, text, text, text, text, text) to anon, authenticated;
