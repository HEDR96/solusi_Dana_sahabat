-- ============================================================================
-- FPD (First Payment Default) — pemantauan cicilan awal nasabah
-- ============================================================================
-- Sistem berhenti di "approve + komisi agen": tidak ada jejak apakah nasabah
-- yang sudah cair benar-benar membayar angsuran awalnya. Padahal di bisnis
-- brokerage leasing, nasabah yang macet di 1-3 angsuran pertama (FPD) bisa
-- berakibat komisi ditarik kembali oleh leasing dan kuota agen dipotong.
--
-- Dilacak ringan: satu status + angsuran ke berapa + catatan, diisi manual
-- oleh owner/super-admin berdasarkan laporan dari pihak leasing.

alter table dsd_applications
  add column if not exists fpd_status       text,
  add column if not exists fpd_angsuran_ke  int,
  add column if not exists fpd_checked_date date,
  add column if not exists fpd_notes        text,
  add column if not exists fpd_updated_by   text;

do $$
begin
  alter table dsd_applications
    add constraint dsd_applications_fpd_status_check
    check (fpd_status is null or fpd_status in ('lancar', 'telat', 'macet'));
exception when duplicate_object then null;
end $$;

-- Berkas macet perlu sering difilter untuk laporan/tindak lanjut
create index if not exists idx_applications_fpd_status
  on dsd_applications (fpd_status) where fpd_status is not null;

-- ---------------------------------------------------------------------------
-- Guard: hanya owner/super-admin yang boleh mengisi/mengubah status FPD.
-- ---------------------------------------------------------------------------
-- Tanpa ini, spv-agen (yang lolos RLS update untuk agen binaannya) bisa
-- menandai "lancar" berkas timnya sendiri yang sebenarnya macet — persis
-- pihak yang paling diuntungkan kalau angka FPD terlihat bagus. Sama seperti
-- migration 016, RLS Postgres cuma memfilter BARIS, bukan KOLOM, jadi
-- pembatasan per-kolom harus lewat trigger.
--
-- FPD juga hanya masuk akal untuk berkas yang sudah approve (sudah cair).
create or replace function dsd_guard_application_fpd()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (
    new.fpd_status      is distinct from old.fpd_status or
    new.fpd_angsuran_ke is distinct from old.fpd_angsuran_ke or
    new.fpd_checked_date is distinct from old.fpd_checked_date or
    new.fpd_notes       is distinct from old.fpd_notes
  ) then
    if dsd_get_my_role() not in ('owner', 'super-admin') then
      raise exception 'Hanya owner/super-admin yang boleh mengubah status FPD';
    end if;
    if new.fpd_status is not null and new.status <> 'approve' then
      raise exception 'Status FPD hanya berlaku untuk berkas yang sudah approve';
    end if;
    -- Jejak siapa yang terakhir memperbarui, diisi server (tidak bisa dipalsukan client)
    new.fpd_updated_by := coalesce(
      (select name from dsd_profiles where id = auth.uid()),
      auth.uid()::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_application_fpd on dsd_applications;
create trigger trg_guard_application_fpd
  before update on dsd_applications
  for each row execute function dsd_guard_application_fpd();
