-- ============================================================================
-- 006: Tabel rate angsuran & fee agent CMD Finance
-- Jalankan di Supabase SQL Editor
-- ============================================================================

create table if not exists dsd_rate_tables (
  id         serial primary key,
  product    text not null,   -- 'motor' | 'mobil'
  tipe       text not null,   -- 'new_ang' | 'new_fee' | 'ro_ang' | 'ro_fee' | 'reg_ang' | 'reg_fee'
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(product, tipe)
);

alter table dsd_rate_tables enable row level security;

drop policy if exists rate_tables_select on dsd_rate_tables;
create policy rate_tables_select on dsd_rate_tables
  for select to authenticated using (true);

drop policy if exists rate_tables_write on dsd_rate_tables;
create policy rate_tables_write on dsd_rate_tables
  for all to authenticated
  using      (dsd_get_my_role() in ('owner','super-admin'))
  with check (dsd_get_my_role() in ('owner','super-admin'));
