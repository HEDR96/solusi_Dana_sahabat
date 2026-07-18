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
