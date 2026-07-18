-- ============================================================================
-- 009 — Perbaikan keamanan & konsistensi komisi (Jul 2026)
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor.
--
-- Isi:
--  1. Akun nonaktif tidak lagi dianggap punya role → semua policy berbasis
--     dsd_get_my_role() otomatis menolak (lamaran agen belum diaktivasi, dsb.)
--  2. Policy "using (true)" dipersempit: hanya user AKTIF yang bisa membaca
--     profiles/agents/leasing/status_logs/notifications
--  3. Cegah privilege escalation: user biasa tidak bisa mengubah role/status/
--     agent_id di profilnya sendiri (dulu policy update tanpa batasan kolom)
--  4. Trigger komisi membaca rate dari Settings (app_settings.global) —
--     dulu selalu memakai default kolom 1.5 apa pun setting owner
--  5. dsd_apply_as_agent memakai max(ID)+1 — count+1 menghasilkan ID duplikat
--     setelah ada agen yang dihapus
-- ============================================================================

-- ── 1. Role hanya berlaku untuk akun AKTIF ──────────────────────────────────
create or replace function dsd_get_my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from dsd_profiles where id = auth.uid() and status = 'aktif'
$$;

create or replace function dsd_get_my_agent_id() returns text
language sql stable security definer set search_path = public as $$
  select agent_id from dsd_profiles where id = auth.uid() and status = 'aktif'
$$;

-- ── 2. Persempit policy yang dulu using (true) ──────────────────────────────
drop policy if exists dsd_profiles_select on dsd_profiles;
create policy dsd_profiles_select on dsd_profiles for select to authenticated
  using (id = auth.uid() or dsd_get_my_role() is not null);

drop policy if exists dsd_agents_select on dsd_agents;
create policy dsd_agents_select on dsd_agents for select to authenticated
  using (dsd_get_my_role() is not null);

drop policy if exists dsd_leasing_select on dsd_leasing_partners;
create policy dsd_leasing_select on dsd_leasing_partners for select to authenticated
  using (dsd_get_my_role() is not null);

drop policy if exists dsd_status_logs_select on dsd_status_logs;
create policy dsd_status_logs_select on dsd_status_logs for select to authenticated
  using (dsd_get_my_role() is not null);
drop policy if exists dsd_status_logs_insert on dsd_status_logs;
create policy dsd_status_logs_insert on dsd_status_logs for insert to authenticated
  with check (dsd_get_my_role() is not null);

drop policy if exists dsd_activities_insert on dsd_agent_activities;
create policy dsd_activities_insert on dsd_agent_activities for insert to authenticated
  with check (dsd_get_my_role() is not null);

drop policy if exists dsd_notifications_all on dsd_notifications;
create policy dsd_notifications_all on dsd_notifications for all to authenticated
  using (dsd_get_my_role() is not null)
  with check (dsd_get_my_role() is not null);

drop policy if exists dsd_audit_insert on dsd_audit_logs;
create policy dsd_audit_insert on dsd_audit_logs for insert to authenticated
  with check (dsd_get_my_role() is not null);

-- ── 3. Blokir user biasa mengubah role/status/agent_id miliknya sendiri ─────
-- Policy update lama mengizinkan "id = auth.uid()" tanpa batasan kolom,
-- sehingga siapa pun bisa PATCH role='owner' pada barisnya sendiri.
create or replace function dsd_guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  caller_role text;
begin
  select role into caller_role from dsd_profiles where id = auth.uid() and status = 'aktif';
  if coalesce(caller_role, '') not in ('owner', 'super-admin') then
    if new.role       is distinct from old.role
       or new.status  is distinct from old.status
       or new.agent_id is distinct from old.agent_id then
      raise exception 'Tidak diizinkan mengubah role/status/agent_id';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile_update on dsd_profiles;
create trigger trg_guard_profile_update
  before update on dsd_profiles
  for each row execute function dsd_guard_profile_update();

-- ── 4. Trigger komisi: rate & saklar autoCommission dari Settings ───────────
create or replace function dsd_create_commission_on_approve()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s jsonb;
  rate numeric;
  auto_on boolean;
begin
  if new.status = 'approve' and old.status <> 'approve' and new.approve_pinjaman is not null then
    -- Settings global disimpan sebagai JSON di dsd_master_options (app_settings/global)
    begin
      select label::jsonb into s from dsd_master_options
        where category = 'app_settings' and value = 'global' limit 1;
    exception when others then s := null;
    end;
    auto_on := coalesce((s->>'autoCommission')::boolean, true);
    if not auto_on then return new; end if;
    rate := coalesce(nullif(s->>'commissionRate', '')::numeric, new.commission_rate, 1.5);

    insert into dsd_commissions
      (app_id, customer_name, agent_id, agent_name, leasing_name,
       approve_pinjaman, approve_date, commission_rate, commission_amount, status)
    values (
      new.id, new.customer_name, new.agent_id, new.agent_name, new.leasing_name,
      new.approve_pinjaman, coalesce(new.approve_date, current_date),
      rate,
      round(new.approve_pinjaman * rate / 100),
      'unpaid'
    )
    on conflict do nothing;
  end if;
  return new;
end $$;

-- ── 5. dsd_apply_as_agent: ID dari max, bukan count ─────────────────────────
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

  select coalesce(max(nullif(regexp_replace(id, '\D', '', 'g'), '')::int), 0) + 1
    into seq_next from dsd_agents;
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
