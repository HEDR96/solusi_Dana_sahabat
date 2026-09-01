-- ============================================================================
-- Audit log & riwayat status: anti-pemalsuan
-- ============================================================================
-- Sebelumnya kolom "user", role, dan time diisi APA ADANYA dari client
-- (AppContext.addAuditLog mengirim currentUser.name/role/waktu dari browser).
-- Policy insert cuma memeriksa "punya role", tidak memeriksa isi barisnya —
-- jadi siapa pun yang login bisa menyisipkan entri atas nama orang lain,
-- misalnya agen membuat entri "Hendrik / owner / Hapus Data" untuk menjebak,
-- atau memundurkan `time` agar aksinya seolah terjadi di hari lain.
--
-- Perbaikan: identitas & waktu diisi SERVER dari auth.uid(), nilai kiriman
-- client diabaikan. Ditambah actor_id (uuid) supaya log tertaut ke akun
-- sungguhan, bukan cuma nama yang bisa berubah/kembar.

-- ── 1. Identitas sungguhan pada audit log ───────────────────────────────────
alter table dsd_audit_logs
  add column if not exists actor_id uuid references auth.users(id);

create index if not exists idx_audit_logs_actor on dsd_audit_logs (actor_id);
create index if not exists idx_audit_logs_created on dsd_audit_logs (created_at desc);

create or replace function dsd_stamp_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  -- auth.uid() null = dipanggil service_role / job internal (bukan sesi user).
  -- Biarkan apa adanya supaya proses maintenance tetap bisa menulis log.
  if uid is null then
    return new;
  end if;

  new.actor_id := uid;
  new."user"   := coalesce(
    nullif((select name from dsd_profiles where id = uid), ''),
    (select email from dsd_profiles where id = uid),
    uid::text
  );
  new.role := coalesce(dsd_get_my_role(), 'unknown');
  -- Kolom time bertipe text dan dibaca sebagai Date di web — pakai ISO 8601
  -- agar new Date() memparsinya konsisten di semua browser.
  new.time := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  -- IP dari client tidak bisa diverifikasi di sini; jangan simpan klaim palsu.
  new.ip := null;
  return new;
end;
$$;

drop trigger if exists trg_stamp_audit_log on dsd_audit_logs;
create trigger trg_stamp_audit_log
  before insert on dsd_audit_logs
  for each row execute function dsd_stamp_audit_log();

-- ── 2. Audit log bersifat append-only ───────────────────────────────────────
-- RLS memang belum punya policy update/delete (jadi sudah ditolak), tapi itu
-- bergantung pada ketiadaan policy — sekali ada yang menambah policy update
-- untuk keperluan lain, log jadi bisa disunting tanpa disadari. Trigger ini
-- menutupnya secara eksplisit, apa pun policy-nya.
-- Yang diblokir adalah sesi USER aplikasi (auth.uid() tidak null) — termasuk
-- owner, karena justru orang dengan akses terbesar yang paling perlu diawasi.
-- Akses tanpa sesi user (service_role, SQL Editor, job maintenance) dilewatkan:
-- konteks itu toh bisa menghapus trigger ini sendiri, jadi memblokirnya tidak
-- menambah keamanan — hanya membuat pemeliharaan sah (mis. arsip log lama)
-- gagal dengan pesan membingungkan.
create or replace function dsd_block_audit_mutation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception 'Audit log bersifat append-only — tidak dapat diubah atau dihapus';
end;
$$;

drop trigger if exists trg_block_audit_mutation on dsd_audit_logs;
create trigger trg_block_audit_mutation
  before update or delete on dsd_audit_logs
  for each row execute function dsd_block_audit_mutation();

-- ── 3. Riwayat status berkas juga tidak boleh dipalsukan ────────────────────
-- dsd_status_logs."user" punya masalah yang sama: diisi dari client, padahal
-- inilah bukti siapa yang menyetujui/menolak sebuah berkas.
alter table dsd_status_logs
  add column if not exists actor_id uuid references auth.users(id);

create or replace function dsd_stamp_status_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return new;
  end if;
  new.actor_id := uid;
  new."user" := coalesce(
    nullif((select name from dsd_profiles where id = uid), ''),
    (select email from dsd_profiles where id = uid),
    uid::text
  );
  return new;
end;
$$;

drop trigger if exists trg_stamp_status_log on dsd_status_logs;
create trigger trg_stamp_status_log
  before insert on dsd_status_logs
  for each row execute function dsd_stamp_status_log();

-- Catatan: baris lama (sebelum migration ini) tetap actor_id = null karena
-- kolom "user" hanya menyimpan nama dan tidak bisa dipetakan balik ke akun
-- secara andal (nama bisa kembar/berubah). Log lama tetap dianggap sah
-- namun tidak terverifikasi — yang baru sejak sekarang terverifikasi.
