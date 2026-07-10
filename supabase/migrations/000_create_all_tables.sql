-- ============================================================================
-- SOLUSI DANA SAHABAT — ERP Multifinance
-- INISIALISASI DATABASE LENGKAP
-- Jalankan SEKALI di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Semua tabel diawali dengan prefix "dsd_"
-- ============================================================================

-- Aktifkan ekstensi yang dibutuhkan
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES (terhubung ke auth.users Supabase)
-- ============================================================================
create table if not exists dsd_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null default '',
  email        text not null default '',
  role         text not null default 'agen'
                 check (role in ('owner','super-admin','admin','spv-agen','agen','surveyor','finance')),
  status       text not null default 'aktif' check (status in ('aktif','nonaktif')),
  agent_id     text,               -- ID agen terkait jika role = agen
  last_login   timestamptz,
  created_at   timestamptz default now()
);

-- Buat profil otomatis saat user baru didaftarkan via Admin API
create or replace function dsd_on_auth_user_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into dsd_profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function dsd_on_auth_user_created();

-- ============================================================================
-- 2. MASTER OPTIONS (dropdown semua form — dikelola owner)
-- ============================================================================
create table if not exists dsd_master_options (
  id       bigint generated always as identity primary key,
  category text   not null,
  value    text   not null,
  label    text,                    -- teks tampilan (untuk kategori berpasangan)
  sort     int    default 0,
  active   boolean default true,
  unique (category, value)
);

-- Seed data awal
insert into dsd_master_options (category, value, label, sort) values
  -- Tipe Unit
  ('unit_type','Motor',null,1), ('unit_type','Mobil',null,2),
  ('unit_type','Alat Berat',null,3), ('unit_type','Sertifikat',null,4),
  -- Tenor (bulan)
  ('tenor','6',null,1),('tenor','12',null,2),('tenor','18',null,3),
  ('tenor','24',null,4),('tenor','36',null,5),('tenor','48',null,6),('tenor','60',null,7),
  -- Bank
  ('bank','BCA',null,1),('bank','BRI',null,2),('bank','BNI',null,3),
  ('bank','Mandiri',null,4),('bank','BSI',null,5),('bank','CIMB',null,6),
  -- Metode Bayar
  ('payment_method','Transfer Bank',null,1),('payment_method','Cash',null,2),
  ('payment_method','QRIS',null,3),('payment_method','Cek',null,4),
  -- Kota
  ('city','Jakarta',null,1),('city','Bandung',null,2),('city','Surabaya',null,3),
  ('city','Medan',null,4),('city','Semarang',null,5),('city','Makassar',null,6),
  ('city','Palembang',null,7),('city','Yogyakarta',null,8),('city','Denpasar',null,9),
  ('city','Balikpapan',null,10),
  -- Jenis Aktivitas
  ('activity_type','kunjungan-dealer','Kunjungan Dealer',1),
  ('activity_type','follow-up','Follow Up Nasabah',2),
  ('activity_type','cold-call','Cold Call / Telepon',3),
  ('activity_type','referral','Referral Nasabah',4),
  ('activity_type','survey-lokasi','Survey Lokasi',5),
  ('activity_type','networking','Networking / Event',6),
  -- Hasil Aktivitas
  ('activity_outcome','prospek-baru','Prospek Baru',1),
  ('activity_outcome','follow-up-lanjutan','Perlu Follow Up',2),
  ('activity_outcome','menghasilkan-berkas','Menghasilkan Berkas',3),
  ('activity_outcome','tidak-berhasil','Tidak Berhasil',4),
  -- Role (label tampilan)
  ('role','owner','Owner',1),
  ('role','super-admin','Super Admin',2),
  ('role','admin','Admin / Back Office',3),
  ('role','spv-agen','Supervisor Agen',4),
  ('role','agen','Agen',5),
  ('role','surveyor','Surveyor',6),
  ('role','finance','Finance',7),
  -- Kegunaan per role
  ('roleperm:owner','Semua akses sistem tanpa batasan',null,1),
  ('roleperm:owner','Kelola semua user & role',null,2),
  ('roleperm:owner','Akses semua laporan & data',null,3),
  ('roleperm:owner','Kelola pengaturan sistem',null,4),
  ('roleperm:super-admin','Semua akses sistem',null,1),
  ('roleperm:super-admin','Kelola user & role',null,2),
  ('roleperm:super-admin','Lihat semua laporan',null,3),
  ('roleperm:admin','Input & kelola berkas',null,1),
  ('roleperm:admin','Ubah status pengajuan',null,2),
  ('roleperm:admin','Atur jadwal survey',null,3),
  ('roleperm:admin','Lihat laporan & komisi',null,4),
  ('roleperm:spv-agen','Lihat agen di bawah supervisinya',null,1),
  ('roleperm:spv-agen','Monitor berkas & komisi agen binaan',null,2),
  ('roleperm:spv-agen','Lihat aktivitas agen supervised',null,3),
  ('roleperm:spv-agen','Laporan filtered per agen binaan',null,4),
  ('roleperm:agen','Input berkas pengajuan',null,1),
  ('roleperm:agen','Lihat berkas & komisi sendiri',null,2),
  ('roleperm:agen','Catat aktivitas harian',null,3),
  ('roleperm:surveyor','Lihat jadwal survey',null,1),
  ('roleperm:surveyor','Update hasil survey',null,2),
  ('roleperm:finance','Kelola pembayaran komisi',null,1),
  ('roleperm:finance','Lihat laporan keuangan',null,2)
on conflict (category, value) do nothing;

-- ============================================================================
-- 3. AGEN
-- ============================================================================
create table if not exists dsd_agents (
  id             text primary key,          -- format: AGT001, AGT002, ...
  name           text not null,
  phone          text,
  email          text,
  city           text,
  address        text,
  nik            text unique,
  status         text default 'aktif' check (status in ('aktif','nonaktif')),
  join_date      date,
  bank           text,
  account_number text,
  account_name   text,
  target         int  default 10,
  notes          text,
  total_approve  int  default 0,
  total_reject   int  default 0,
  total_berkas   int  default 0,
  spv_id         uuid references auth.users(id),  -- supervisor (user dengan role spv-agen)
  created_at     timestamptz default now()
);

-- ============================================================================
-- 4. LEASING PARTNERS
-- ============================================================================
create table if not exists dsd_leasing_partners (
  id     bigint generated always as identity primary key,
  name   text not null,
  rate   numeric(5,2) default 1.5,  -- rate komisi persen
  status text default 'aktif' check (status in ('aktif','nonaktif'))
);

-- Seed leasing awal
insert into dsd_leasing_partners (name, rate, status) values
  ('Adira Finance',  1.5, 'aktif'),
  ('BFI Finance',    1.5, 'aktif'),
  ('FIF Group',      1.5, 'aktif'),
  ('OTO Finance',    1.5, 'aktif'),
  ('WOM Finance',    1.5, 'aktif'),
  ('BAF',            1.5, 'aktif'),
  ('Mandiri Utama',  1.5, 'aktif')
on conflict do nothing;

-- ============================================================================
-- 5. SEQUENCE NOMOR BERKAS (anti-tabrakan saat submit bersamaan)
-- ============================================================================
create sequence if not exists dsd_brk_seq start 1;

create or replace function dsd_next_brk_id() returns text
language sql volatile security definer set search_path = public as $$
  select 'BRK' || lpad((2026000 + nextval('dsd_brk_seq'))::text, 7, '0')
$$;
grant execute on function dsd_next_brk_id() to authenticated;

-- ============================================================================
-- 6. PENGAJUAN BERKAS (APPLICATIONS)
-- ============================================================================
create table if not exists dsd_applications (
  id                text primary key default dsd_next_brk_id(),
  customer_name     text not null,
  nik               text,
  phone             text,
  city              text,
  address           text,
  agent_id          text references dsd_agents(id),
  agent_name        text,
  leasing_id        bigint references dsd_leasing_partners(id),
  leasing_name      text,
  unit_type         text,
  unit_brand        text,
  unit_year         int,
  pinjaman          bigint default 0,
  tenor             int    default 12,
  estimasi_angsuran bigint default 0,
  status            text   default 'pending'
                      check (status in ('pending','cek-data','janji-survey','survey','komite','approve','cancel','reject')),
  input_date        date   default current_date,
  approve_date      date,
  approve_pinjaman  bigint,
  survey_date       date,
  survey_time       text,
  survey_result     text,
  notes             text,
  commission_rate   numeric(5,2) default 1.5,
  created_at        timestamptz default now()
);

-- ============================================================================
-- 7. RIWAYAT STATUS BERKAS
-- ============================================================================
create table if not exists dsd_status_logs (
  id          bigint generated always as identity primary key,
  app_id      text references dsd_applications(id) on delete cascade,
  from_status text,
  to_status   text not null,
  "user"      text,
  date        date default current_date,
  notes       text,
  created_at  timestamptz default now()
);

-- ============================================================================
-- 8. KOMISI AGEN
-- ============================================================================
create table if not exists dsd_commissions (
  id                bigint generated always as identity primary key,
  app_id            text references dsd_applications(id) on delete cascade,
  customer_name     text,
  agent_id          text references dsd_agents(id),
  agent_name        text,
  leasing_name      text,
  approve_pinjaman  bigint default 0,
  approve_date      date,
  commission_rate   numeric(5,2) default 1.5,
  commission_amount bigint default 0,
  status            text default 'unpaid' check (status in ('paid','unpaid')),
  payment_date      date,
  payment_method    text,
  notes             text,
  created_at        timestamptz default now()
);

-- Buat komisi otomatis saat status berubah menjadi approve
create or replace function dsd_create_commission_on_approve()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approve' and old.status <> 'approve' and new.approve_pinjaman is not null then
    insert into dsd_commissions
      (app_id, customer_name, agent_id, agent_name, leasing_name,
       approve_pinjaman, approve_date, commission_rate, commission_amount, status)
    values (
      new.id, new.customer_name, new.agent_id, new.agent_name, new.leasing_name,
      new.approve_pinjaman, coalesce(new.approve_date, current_date),
      new.commission_rate,
      round(new.approve_pinjaman * new.commission_rate / 100),
      'unpaid'
    )
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_commission_on_approve on dsd_applications;
create trigger trg_commission_on_approve
  after update on dsd_applications
  for each row execute function dsd_create_commission_on_approve();

-- ============================================================================
-- 9. AKTIVITAS AGEN
-- ============================================================================
create table if not exists dsd_agent_activities (
  id              bigint generated always as identity primary key,
  agent_id        text references dsd_agents(id),
  agent_name      text,
  date            date default current_date,
  type            text,   -- nilai dari master_options category=activity_type
  description     text,
  outcome         text,   -- nilai dari master_options category=activity_outcome
  related_app_id  text references dsd_applications(id),
  created_at      timestamptz default now()
);

-- ============================================================================
-- 10. NOTIFIKASI
-- ============================================================================
create table if not exists dsd_notifications (
  id         bigint generated always as identity primary key,
  type       text,
  message    text not null,
  time_ago   text,
  read       boolean default false,
  link       text,
  created_at timestamptz default now()
);

-- ============================================================================
-- 11. AUDIT LOG
-- ============================================================================
create table if not exists dsd_audit_logs (
  id         bigint generated always as identity primary key,
  "user"     text,
  role       text,
  action     text not null,
  detail     text,
  time       text,
  ip         text,
  created_at timestamptz default now()
);

-- ============================================================================
-- 12. LOKASI AGEN (untuk peta realtime owner)
-- ============================================================================
create table if not exists dsd_agent_locations (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text,
  role       text,
  lat        double precision,
  lng        double precision,
  updated_at timestamptz default now()
);

-- ============================================================================
-- 13. LAMARAN AGEN (dari landing page /daftar-agen)
-- ============================================================================
create or replace function dsd_apply_as_agent(
  p_name    text, p_phone text, p_email text,
  p_city    text, p_address text, p_nik text
) returns text language plpgsql volatile security definer set search_path = public as $$
declare
  new_id   text;
  seq_next int;
begin
  if coalesce(trim(p_name), '')  = '' then raise exception 'Nama wajib diisi';  end if;
  if coalesce(trim(p_phone), '') = '' then raise exception 'No. HP wajib diisi'; end if;
  if length(coalesce(p_nik, '')) <> 16 then raise exception 'NIK harus 16 digit'; end if;

  if exists (select 1 from dsd_agents where nik = p_nik or phone = p_phone) then
    raise exception 'NIK atau No. HP sudah terdaftar';
  end if;

  select count(*) + 1 into seq_next from dsd_agents;
  new_id := 'AGT' || lpad(seq_next::text, 3, '0');

  insert into dsd_agents (id, name, phone, email, city, address, nik, status,
                           join_date, target, total_approve, total_reject, total_berkas, notes)
  values (new_id, trim(p_name), trim(p_phone), trim(p_email),
          trim(p_city), trim(p_address), p_nik, 'nonaktif',
          current_date, 10, 0, 0, 0,
          'Pendaftaran mandiri dari landing page — menunggu aktivasi owner');

  insert into dsd_notifications (type, message, time_ago, read, link)
  values ('agen-baru',
          'Lamaran agen baru: ' || trim(p_name) || ' (' || coalesce(trim(p_city), '-') || ') — menunggu aktivasi',
          'Baru saja', false, '/agents');

  return new_id;
end $$;

grant execute on function dsd_apply_as_agent(text,text,text,text,text,text) to anon, authenticated;

-- ============================================================================
-- 14. ROW LEVEL SECURITY
-- ============================================================================

-- Helper: ambil role user yang sedang login
create or replace function dsd_get_my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from dsd_profiles where id = auth.uid()
$$;

create or replace function dsd_get_my_agent_id() returns text
language sql stable security definer set search_path = public as $$
  select agent_id from dsd_profiles where id = auth.uid()
$$;

create or replace function dsd_my_managed_agent_ids() returns setof text
language sql stable security definer set search_path = public as $$
  select id from dsd_agents where spv_id = auth.uid()
$$;

-- Aktifkan RLS
alter table dsd_profiles          enable row level security;
alter table dsd_agents            enable row level security;
alter table dsd_applications      enable row level security;
alter table dsd_leasing_partners  enable row level security;
alter table dsd_commissions       enable row level security;
alter table dsd_status_logs       enable row level security;
alter table dsd_agent_activities  enable row level security;
alter table dsd_notifications     enable row level security;
alter table dsd_audit_logs        enable row level security;
alter table dsd_agent_locations   enable row level security;
alter table dsd_master_options    enable row level security;

-- PROFILES
drop policy if exists dsd_profiles_select on dsd_profiles;
create policy dsd_profiles_select on dsd_profiles for select to authenticated using (true);
drop policy if exists dsd_profiles_update on dsd_profiles;
create policy dsd_profiles_update on dsd_profiles for update to authenticated
  using (id = auth.uid() or dsd_get_my_role() in ('owner','super-admin'));
drop policy if exists dsd_profiles_insert on dsd_profiles;
create policy dsd_profiles_insert on dsd_profiles for insert to authenticated
  with check (dsd_get_my_role() in ('owner','super-admin') or id = auth.uid());

-- AGENTS
drop policy if exists dsd_agents_select on dsd_agents;
create policy dsd_agents_select on dsd_agents for select to authenticated using (true);
drop policy if exists dsd_agents_write on dsd_agents;
create policy dsd_agents_write on dsd_agents for all to authenticated
  using (dsd_get_my_role() in ('owner','super-admin','admin'))
  with check (dsd_get_my_role() in ('owner','super-admin','admin'));

-- APPLICATIONS
drop policy if exists dsd_applications_select on dsd_applications;
create policy dsd_applications_select on dsd_applications for select to authenticated
  using (
    dsd_get_my_role() in ('owner','super-admin','admin','surveyor','finance')
    or (dsd_get_my_role() = 'agen'     and agent_id = dsd_get_my_agent_id())
    or (dsd_get_my_role() = 'spv-agen' and agent_id in (select dsd_my_managed_agent_ids()))
  );
drop policy if exists dsd_applications_insert on dsd_applications;
create policy dsd_applications_insert on dsd_applications for insert to authenticated
  with check (
    dsd_get_my_role() in ('owner','super-admin','admin','spv-agen')
    or (dsd_get_my_role() = 'agen' and agent_id = dsd_get_my_agent_id())
  );
drop policy if exists dsd_applications_update on dsd_applications;
create policy dsd_applications_update on dsd_applications for update to authenticated
  using (
    dsd_get_my_role() in ('owner','super-admin','admin','surveyor')
    or (dsd_get_my_role() = 'spv-agen' and agent_id in (select dsd_my_managed_agent_ids()))
  );

-- LEASING PARTNERS
drop policy if exists dsd_leasing_select on dsd_leasing_partners;
create policy dsd_leasing_select on dsd_leasing_partners for select to authenticated using (true);
drop policy if exists dsd_leasing_write on dsd_leasing_partners;
create policy dsd_leasing_write on dsd_leasing_partners for all to authenticated
  using (dsd_get_my_role() in ('owner','super-admin','admin'))
  with check (dsd_get_my_role() in ('owner','super-admin','admin'));

-- COMMISSIONS
drop policy if exists dsd_commissions_select on dsd_commissions;
create policy dsd_commissions_select on dsd_commissions for select to authenticated
  using (
    dsd_get_my_role() in ('owner','super-admin','admin','finance')
    or (dsd_get_my_role() = 'agen'     and agent_id = dsd_get_my_agent_id())
    or (dsd_get_my_role() = 'spv-agen' and agent_id in (select dsd_my_managed_agent_ids()))
  );
drop policy if exists dsd_commissions_write on dsd_commissions;
create policy dsd_commissions_write on dsd_commissions for all to authenticated
  using (dsd_get_my_role() in ('owner','super-admin','admin','finance'))
  with check (dsd_get_my_role() in ('owner','super-admin','admin','finance'));

-- STATUS LOGS
drop policy if exists dsd_status_logs_select on dsd_status_logs;
create policy dsd_status_logs_select on dsd_status_logs for select to authenticated using (true);
drop policy if exists dsd_status_logs_insert on dsd_status_logs;
create policy dsd_status_logs_insert on dsd_status_logs for insert to authenticated with check (true);

-- AGENT ACTIVITIES
drop policy if exists dsd_activities_select on dsd_agent_activities;
create policy dsd_activities_select on dsd_agent_activities for select to authenticated
  using (
    dsd_get_my_role() in ('owner','super-admin','admin')
    or (dsd_get_my_role() = 'agen'     and agent_id = dsd_get_my_agent_id())
    or (dsd_get_my_role() = 'spv-agen' and agent_id in (select dsd_my_managed_agent_ids()))
  );
drop policy if exists dsd_activities_insert on dsd_agent_activities;
create policy dsd_activities_insert on dsd_agent_activities for insert to authenticated with check (true);

-- NOTIFICATIONS
drop policy if exists dsd_notifications_all on dsd_notifications;
create policy dsd_notifications_all on dsd_notifications for all to authenticated
  using (true) with check (true);

-- AUDIT LOGS
drop policy if exists dsd_audit_select on dsd_audit_logs;
create policy dsd_audit_select on dsd_audit_logs for select to authenticated
  using (dsd_get_my_role() in ('owner','super-admin'));
drop policy if exists dsd_audit_insert on dsd_audit_logs;
create policy dsd_audit_insert on dsd_audit_logs for insert to authenticated with check (true);

-- AGENT LOCATIONS
drop policy if exists dsd_locations_select on dsd_agent_locations;
create policy dsd_locations_select on dsd_agent_locations for select to authenticated
  using (dsd_get_my_role() in ('owner','super-admin'));
drop policy if exists dsd_locations_upsert on dsd_agent_locations;
create policy dsd_locations_upsert on dsd_agent_locations for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists dsd_locations_update on dsd_agent_locations;
create policy dsd_locations_update on dsd_agent_locations for update to authenticated
  using (user_id = auth.uid());

-- MASTER OPTIONS
drop policy if exists dsd_master_select on dsd_master_options;
create policy dsd_master_select on dsd_master_options for select to anon, authenticated using (true);
drop policy if exists dsd_master_write on dsd_master_options;
create policy dsd_master_write on dsd_master_options for all to authenticated
  using (dsd_get_my_role() in ('owner','super-admin','admin'))
  with check (dsd_get_my_role() in ('owner','super-admin','admin'));

-- ============================================================================
-- SELESAI — semua tabel dsd_ siap digunakan
-- ============================================================================
