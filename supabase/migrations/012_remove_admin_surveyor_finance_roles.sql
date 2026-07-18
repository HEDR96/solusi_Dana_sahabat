-- ============================================================================
-- 012 — Hapus role admin/surveyor/finance dari sistem (Jul 2026)
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor (setelah 011).
--
-- Konfirmasi sebelum menjalankan: TIDAK ADA akun dengan role admin/surveyor/
-- finance saat ini (dikonfirmasi user). Kalau ternyata ada, migration ini akan
-- GAGAL di langkah constraint (baris lama melanggar constraint baru) — aman,
-- tidak ada perubahan yang ter-apply sebagian; ubah dulu role akun tsb lewat
-- halaman Users, baru jalankan ulang.
--
-- Role yang tersisa: owner, super-admin, spv-agen, agen.
-- ============================================================================

-- ── 1. Constraint role di dsd_profiles ──────────────────────────────────────
alter table dsd_profiles drop constraint if exists dsd_profiles_role_check;
alter table dsd_profiles
  add constraint dsd_profiles_role_check
  check (role in ('owner','super-admin','spv-agen','agen'));

-- ── 2. RLS: buang admin/surveyor/finance dari semua policy ─────────────────
drop policy if exists dsd_agents_write on dsd_agents;
create policy dsd_agents_write on dsd_agents for all to authenticated
  using (dsd_get_my_role() in ('owner','super-admin'))
  with check (dsd_get_my_role() in ('owner','super-admin'));

drop policy if exists dsd_applications_select on dsd_applications;
create policy dsd_applications_select on dsd_applications for select to authenticated
  using (
    dsd_get_my_role() in ('owner','super-admin')
    or (dsd_get_my_role() = 'agen'     and agent_id = dsd_get_my_agent_id())
    or (dsd_get_my_role() = 'spv-agen' and agent_id in (select dsd_my_managed_agent_ids()))
  );

drop policy if exists dsd_applications_insert on dsd_applications;
create policy dsd_applications_insert on dsd_applications for insert to authenticated
  with check (
    dsd_get_my_role() in ('owner','super-admin','spv-agen')
    or (dsd_get_my_role() = 'agen' and agent_id = dsd_get_my_agent_id())
  );

drop policy if exists dsd_applications_update on dsd_applications;
create policy dsd_applications_update on dsd_applications for update to authenticated
  using (
    dsd_get_my_role() in ('owner','super-admin')
    or (dsd_get_my_role() = 'spv-agen' and agent_id in (select dsd_my_managed_agent_ids()))
  );

drop policy if exists dsd_leasing_write on dsd_leasing_partners;
create policy dsd_leasing_write on dsd_leasing_partners for all to authenticated
  using (dsd_get_my_role() in ('owner','super-admin'))
  with check (dsd_get_my_role() in ('owner','super-admin'));

drop policy if exists dsd_commissions_select on dsd_commissions;
create policy dsd_commissions_select on dsd_commissions for select to authenticated
  using (
    dsd_get_my_role() in ('owner','super-admin')
    or (dsd_get_my_role() = 'agen'     and agent_id = dsd_get_my_agent_id())
    or (dsd_get_my_role() = 'spv-agen' and agent_id in (select dsd_my_managed_agent_ids()))
  );

drop policy if exists dsd_commissions_write on dsd_commissions;
create policy dsd_commissions_write on dsd_commissions for all to authenticated
  using (dsd_get_my_role() in ('owner','super-admin'))
  with check (dsd_get_my_role() in ('owner','super-admin'));

drop policy if exists dsd_activities_select on dsd_agent_activities;
create policy dsd_activities_select on dsd_agent_activities for select to authenticated
  using (
    dsd_get_my_role() in ('owner','super-admin')
    or (dsd_get_my_role() = 'agen'     and agent_id = dsd_get_my_agent_id())
    or (dsd_get_my_role() = 'spv-agen' and agent_id in (select dsd_my_managed_agent_ids()))
  );

drop policy if exists dsd_master_write on dsd_master_options;
create policy dsd_master_write on dsd_master_options for all to authenticated
  using (dsd_get_my_role() in ('owner','super-admin'))
  with check (dsd_get_my_role() in ('owner','super-admin'));

-- Push messages (migration 010) — juga referensi 'admin'
drop policy if exists "push_insert" on dsd_push_messages;
create policy "push_insert" on dsd_push_messages for insert to authenticated
  with check (dsd_get_my_role() in ('owner', 'super-admin'));

drop policy if exists "push_select" on dsd_push_messages;
create policy "push_select" on dsd_push_messages for select to authenticated
  using (
    target_user_id is null
    or target_user_id = auth.uid()
    or dsd_get_my_role() in ('owner', 'super-admin')
  );

-- SPV insert agen (migration 010) — tidak referensi admin, tidak berubah.

-- ── 3. Bersihkan opsi dropdown role & deskripsi kegunaan yang sudah dihapus ─
delete from dsd_master_options where category = 'role' and value in ('admin','surveyor','finance');
delete from dsd_master_options where category in ('roleperm:admin','roleperm:surveyor','roleperm:finance');
