-- ============================================================================
-- Pesan dari form kontak landing page
-- ============================================================================
-- Form "Kirim Pesan" di halaman Hubungi Kami tidak pernah mengirim ke mana pun:
-- handler-nya cuma setSent(true), sehingga pengunjung membaca "Pesan Terkirim!"
-- padahal tidak ada apa pun yang tersimpan. Semua calon nasabah yang menghubungi
-- lewat halaman itu hilang tanpa jejak.
--
-- Pesan kontak sengaja TIDAK dimasukkan ke dsd_applications: ini pertanyaan
-- umum, bukan pengajuan pinjaman. Menaruhnya di sana akan mengotori pipeline,
-- merusak laporan aging, dan menggeser angka konversi.

create table if not exists dsd_contact_messages (
  id          bigint generated always as identity primary key,
  name        text not null,
  phone       text not null,
  message     text not null,
  status      text not null default 'baru' check (status in ('baru', 'diproses', 'selesai')),
  handled_by  text,
  handled_at  timestamptz,
  created_at  timestamptz default now()
);

create index if not exists idx_contact_messages_status
  on dsd_contact_messages (status, created_at desc);

alter table dsd_contact_messages enable row level security;

-- Insert dilakukan API /api/lead memakai service key (bypass RLS) — tidak ada
-- policy insert untuk authenticated/anon supaya tabel ini tidak bisa dibanjiri
-- langsung dari browser dengan anon key.
drop policy if exists dsd_contact_messages_select on dsd_contact_messages;
create policy dsd_contact_messages_select on dsd_contact_messages for select to authenticated
  using (dsd_get_my_role() in ('owner', 'super-admin'));

drop policy if exists dsd_contact_messages_update on dsd_contact_messages;
create policy dsd_contact_messages_update on dsd_contact_messages for update to authenticated
  using (dsd_get_my_role() in ('owner', 'super-admin'));

-- Jejak siapa yang menangani, diisi server (pola sama seperti migration 018)
create or replace function dsd_stamp_contact_handled()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if new.status is distinct from old.status and uid is not null then
    new.handled_by := coalesce(
      nullif((select name from dsd_profiles where id = uid), ''),
      (select email from dsd_profiles where id = uid),
      uid::text
    );
    new.handled_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_contact_handled on dsd_contact_messages;
create trigger trg_stamp_contact_handled
  before update on dsd_contact_messages
  for each row execute function dsd_stamp_contact_handled();
