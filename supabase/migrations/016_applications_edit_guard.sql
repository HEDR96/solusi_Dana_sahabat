-- Migration 013 menambah policy DELETE untuk owner, tapi fitur "edit berkas"
-- (Android: updateApplicationFields) memakai policy dsd_applications_update
-- yang lama — policy itu cuma filter BARIS (agent_id milik siapa), bukan
-- KOLOM apa yang boleh diubah. RLS Postgres tidak membatasi kolom secara
-- bawaan, jadi tanpa trigger ini, super-admin/spv-agen (yang lolos filter
-- baris di dsd_applications_update) bisa ikut mengubah nama/NIK/HP/alamat/
-- pinjaman lewat endpoint yang sama, padahal tombol Edit di app cuma
-- ditampilkan untuk owner — proteksi itu selama ini cuma di sisi UI.
--
-- Trigger ini menolak perubahan pada kolom data inti berkas (bukan kolom
-- status/approve yang memang dipakai alur updateApplicationStatus) kecuali
-- pelakunya owner.
create or replace function dsd_guard_application_core_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if dsd_get_my_role() <> 'owner' and (
    new.customer_name is distinct from old.customer_name or
    new.nik           is distinct from old.nik or
    new.phone         is distinct from old.phone or
    new.city          is distinct from old.city or
    new.address       is distinct from old.address or
    new.unit_brand    is distinct from old.unit_brand or
    new.unit_year     is distinct from old.unit_year or
    new.pinjaman      is distinct from old.pinjaman or
    new.tenor         is distinct from old.tenor
  ) then
    raise exception 'Hanya owner yang boleh mengubah data inti berkas';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_application_core_fields on dsd_applications;
create trigger trg_guard_application_core_fields
  before update on dsd_applications
  for each row execute function dsd_guard_application_core_fields();

-- Migration 013 mengaktifkan DELETE untuk owner, yang lewat FK
-- "dsd_commissions.app_id ... on delete cascade" ikut menghapus riwayat
-- komisi — termasuk komisi yang statusnya sudah 'paid'. Blokir penghapusan
-- berkas selama masih ada komisi yang sudah dibayar, supaya jejak audit
-- finansial tidak hilang tanpa sengaja.
create or replace function dsd_guard_application_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from dsd_commissions where app_id = old.id and status = 'paid') then
    raise exception 'Berkas ini punya komisi yang sudah dibayar — tidak bisa dihapus';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_guard_application_delete on dsd_applications;
create trigger trg_guard_application_delete
  before delete on dsd_applications
  for each row execute function dsd_guard_application_delete();
