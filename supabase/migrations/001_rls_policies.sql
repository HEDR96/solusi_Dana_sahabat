-- ============================================================================
-- Row Level Security untuk ERP Solusi Dana Sahabat
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor
--
-- Efek:
--  * Tanpa login (anon key saja) → TIDAK bisa baca/tulis data apa pun
--  * agen      → hanya lihat berkas/komisi/aktivitas miliknya sendiri
--  * spv-agen  → hanya lihat data agen binaannya (agents.spv_id = uid)
--  * owner / super-admin / admin → akses penuh sesuai peran
-- ============================================================================

-- ── Helper: peran & agent_id user yang sedang login ─────────────────────────
create or replace function public.get_my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.get_my_agent_id() returns text
language sql stable security definer set search_path = public as $$
  select agent_id from profiles where id = auth.uid()
$$;

-- Daftar id agen yang dibina oleh spv yang sedang login
create or replace function public.my_managed_agent_ids() returns setof text
language sql stable security definer set search_path = public as $$
  select id from agents where spv_id = auth.uid()
$$;

-- ── Aktifkan RLS di semua tabel ──────────────────────────────────────────────
alter table profiles          enable row level security;
alter table agents            enable row level security;
alter table applications      enable row level security;
alter table leasing_partners  enable row level security;
alter table commissions       enable row level security;
alter table status_logs       enable row level security;
alter table agent_activities  enable row level security;
alter table notifications     enable row level security;
alter table audit_logs        enable row level security;
alter table agent_locations   enable row level security;

-- ── PROFILES ────────────────────────────────────────────────────────────────
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated
  using (true);   -- nama & role dibutuhkan lintas fitur (dropdown spv, dsb.)

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update to authenticated
  using (id = auth.uid() or get_my_role() in ('owner','super-admin'));

drop policy if exists profiles_insert_admin on profiles;
create policy profiles_insert_admin on profiles for insert to authenticated
  with check (get_my_role() in ('owner','super-admin') or id = auth.uid());

-- ── AGENTS ──────────────────────────────────────────────────────────────────
drop policy if exists agents_select on agents;
create policy agents_select on agents for select to authenticated
  using (true);   -- daftar agen tampil di banyak halaman; scoping detail di app

drop policy if exists agents_write on agents;
create policy agents_write on agents for all to authenticated
  using (get_my_role() in ('owner','super-admin','admin'))
  with check (get_my_role() in ('owner','super-admin','admin'));

-- ── APPLICATIONS (paling sensitif: NIK, alamat nasabah) ────────────────────
drop policy if exists applications_select on applications;
create policy applications_select on applications for select to authenticated
  using (
    get_my_role() in ('owner','super-admin','admin','surveyor','finance')
    or (get_my_role() = 'agen'     and agent_id = get_my_agent_id())
    or (get_my_role() = 'spv-agen' and agent_id in (select my_managed_agent_ids()))
  );

drop policy if exists applications_insert on applications;
create policy applications_insert on applications for insert to authenticated
  with check (
    get_my_role() in ('owner','super-admin','admin','spv-agen')
    or (get_my_role() = 'agen' and agent_id = get_my_agent_id())
  );

drop policy if exists applications_update on applications;
create policy applications_update on applications for update to authenticated
  using (
    get_my_role() in ('owner','super-admin','admin','surveyor')
    or (get_my_role() = 'spv-agen' and agent_id in (select my_managed_agent_ids()))
  );

-- ── LEASING PARTNERS ────────────────────────────────────────────────────────
drop policy if exists leasing_select on leasing_partners;
create policy leasing_select on leasing_partners for select to authenticated
  using (true);

drop policy if exists leasing_write on leasing_partners;
create policy leasing_write on leasing_partners for all to authenticated
  using (get_my_role() in ('owner','super-admin','admin'))
  with check (get_my_role() in ('owner','super-admin','admin'));

-- ── COMMISSIONS ─────────────────────────────────────────────────────────────
drop policy if exists commissions_select on commissions;
create policy commissions_select on commissions for select to authenticated
  using (
    get_my_role() in ('owner','super-admin','admin','finance')
    or (get_my_role() = 'agen'     and agent_id = get_my_agent_id())
    or (get_my_role() = 'spv-agen' and agent_id in (select my_managed_agent_ids()))
  );

drop policy if exists commissions_write on commissions;
create policy commissions_write on commissions for all to authenticated
  using (get_my_role() in ('owner','super-admin','admin','finance'))
  with check (get_my_role() in ('owner','super-admin','admin','finance'));

-- ── STATUS LOGS ─────────────────────────────────────────────────────────────
drop policy if exists status_logs_select on status_logs;
create policy status_logs_select on status_logs for select to authenticated
  using (true);   -- akses detail berkas sudah dibatasi lewat applications

drop policy if exists status_logs_insert on status_logs;
create policy status_logs_insert on status_logs for insert to authenticated
  with check (true);

-- ── AGENT ACTIVITIES ────────────────────────────────────────────────────────
drop policy if exists activities_select on agent_activities;
create policy activities_select on agent_activities for select to authenticated
  using (
    get_my_role() in ('owner','super-admin','admin')
    or (get_my_role() = 'agen'     and agent_id = get_my_agent_id())
    or (get_my_role() = 'spv-agen' and agent_id in (select my_managed_agent_ids()))
  );

drop policy if exists activities_insert on agent_activities;
create policy activities_insert on agent_activities for insert to authenticated
  with check (true);

-- ── NOTIFICATIONS ───────────────────────────────────────────────────────────
drop policy if exists notifications_all on notifications;
create policy notifications_all on notifications for all to authenticated
  using (true) with check (true);

-- ── AUDIT LOGS ──────────────────────────────────────────────────────────────
drop policy if exists audit_select on audit_logs;
create policy audit_select on audit_logs for select to authenticated
  using (get_my_role() in ('owner','super-admin'));

drop policy if exists audit_insert on audit_logs;
create policy audit_insert on audit_logs for insert to authenticated
  with check (true);

-- ── AGENT LOCATIONS (peta owner) ────────────────────────────────────────────
drop policy if exists locations_select on agent_locations;
create policy locations_select on agent_locations for select to authenticated
  using (get_my_role() in ('owner','super-admin'));

drop policy if exists locations_upsert on agent_locations;
create policy locations_upsert on agent_locations for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists locations_update on agent_locations;
create policy locations_update on agent_locations for update to authenticated
  using (user_id = auth.uid());
