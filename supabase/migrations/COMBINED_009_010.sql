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
-- ============================================================================
-- 010 — Statistik agen, anti-dobel komisi, policy SPV, push messages,
--        notifikasi per-user (Jul 2026)
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor (setelah 009).
--
-- Isi:
--  1. Counter dsd_agents (total_berkas/approve/reject) dipelihara trigger
--     + backfill satu kali — sebelumnya selalu 0 sehingga "Top Agen" kosong
--  2. Hapus duplikat dsd_commissions per app_id + unique index —
--     approve→reject→approve tidak lagi menghasilkan komisi dobel
--  3. SPV boleh menambah agen binaannya sendiri (dipakai form Android)
--  4. RLS dsd_push_messages dipersempit: hanya owner/super-admin/admin yang
--     bisa mengirim; user hanya bisa membaca broadcast atau pesan untuknya
--  5. Tabel dsd_notification_reads — status "sudah dibaca" per user
-- ============================================================================

-- ── 1. Counter statistik agen ───────────────────────────────────────────────
create or replace function dsd_refresh_agent_totals(p_agent_id text)
returns void language sql security definer set search_path = public as $$
  update dsd_agents a set
    total_berkas  = (select count(*) from dsd_applications where agent_id = p_agent_id),
    total_approve = (select count(*) from dsd_applications where agent_id = p_agent_id and status = 'approve'),
    total_reject  = (select count(*) from dsd_applications where agent_id = p_agent_id and status = 'reject')
  where a.id = p_agent_id
$$;

create or replace function dsd_sync_agent_totals()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') and new.agent_id is not null then
    perform dsd_refresh_agent_totals(new.agent_id);
  end if;
  -- Berkas dipindah agen / dihapus → agen lama ikut disinkronkan
  if tg_op in ('UPDATE', 'DELETE') and old.agent_id is not null
     and (tg_op = 'DELETE' or old.agent_id is distinct from new.agent_id) then
    perform dsd_refresh_agent_totals(old.agent_id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists trg_sync_agent_totals on dsd_applications;
create trigger trg_sync_agent_totals
  after insert or update of status, agent_id or delete on dsd_applications
  for each row execute function dsd_sync_agent_totals();

-- Backfill satu kali untuk semua agen yang sudah ada
update dsd_agents a set
  total_berkas  = coalesce(s.berkas, 0),
  total_approve = coalesce(s.approve, 0),
  total_reject  = coalesce(s.reject, 0)
from (
  select agent_id,
         count(*)                                   as berkas,
         count(*) filter (where status = 'approve') as approve,
         count(*) filter (where status = 'reject')  as reject
  from dsd_applications group by agent_id
) s
where a.id = s.agent_id;

-- ── 2. Anti-dobel komisi ────────────────────────────────────────────────────
-- Hapus duplikat — pertahankan satu baris per app_id: yang sudah PAID
-- diutamakan (riwayat pembayaran tidak hilang), selebihnya baris tertua
delete from dsd_commissions c
where c.app_id is not null
  and c.id not in (
    select distinct on (app_id) id
    from dsd_commissions
    where app_id is not null
    order by app_id, (status = 'paid') desc, id asc
  );

create unique index if not exists uq_dsd_commissions_app_id
  on dsd_commissions (app_id) where app_id is not null;

-- ── 3. SPV boleh menambah agen binaannya sendiri ────────────────────────────
drop policy if exists dsd_agents_insert_spv on dsd_agents;
create policy dsd_agents_insert_spv on dsd_agents for insert to authenticated
  with check (dsd_get_my_role() = 'spv-agen' and spv_id = auth.uid());

-- ── 4. RLS push messages ────────────────────────────────────────────────────
drop policy if exists "push_insert" on dsd_push_messages;
create policy "push_insert" on dsd_push_messages for insert to authenticated
  with check (dsd_get_my_role() in ('owner', 'super-admin', 'admin'));

drop policy if exists "push_select" on dsd_push_messages;
create policy "push_select" on dsd_push_messages for select to authenticated
  using (
    target_user_id is null
    or target_user_id = auth.uid()
    or dsd_get_my_role() in ('owner', 'super-admin', 'admin')
  );

-- ── 5. Status baca notifikasi per user ──────────────────────────────────────
create table if not exists dsd_notification_reads (
  user_id  uuid   not null references auth.users(id) on delete cascade,
  notif_id bigint not null references dsd_notifications(id) on delete cascade,
  read_at  timestamptz default now(),
  primary key (user_id, notif_id)
);

alter table dsd_notification_reads enable row level security;

drop policy if exists notif_reads_own on dsd_notification_reads;
create policy notif_reads_own on dsd_notification_reads for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
