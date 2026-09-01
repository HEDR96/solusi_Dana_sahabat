-- Backfill app_id untuk notifikasi "Berkas Baru" yang dibuat SEBELUM migration
-- 014 (kolom app_id belum ada saat itu) — supaya notifikasi lama juga bisa
-- dibuka ke detail berkas di Android, bukan cuma berkas baru ke depannya.
--
-- Dicocokkan lewat isi pesan ("Berkas baru dari {agen} - {nasabah}") ke
-- dsd_applications dengan agent_name + customer_name yang sama persis
-- (format itu yang dipakai insertApplication saat notifikasi dibuat). Kalau
-- ada lebih dari satu berkas dengan kombinasi nama yang sama (nasabah dobel
-- input, dsb), dipilih yang input_date-nya paling dekat dengan waktu
-- notifikasi dibuat — bukan jaminan 100% benar untuk kasus itu, tapi jauh
-- lebih baik daripada semua notifikasi lama tetap tidak bisa dibuka.
with matched as (
  select
    n.id as notif_id,
    a.id as app_id,
    row_number() over (
      partition by n.id
      order by abs(n.created_at::date - a.input_date)
    ) as rn
  from dsd_notifications n
  join dsd_applications a
    on a.agent_name is not null
   and n.message = 'Berkas baru dari ' || a.agent_name || ' - ' || a.customer_name
  where n.type = 'berkas-baru'
    and n.app_id is null
)
update dsd_notifications n
set app_id = matched.app_id
from matched
where matched.notif_id = n.id
  and matched.rn = 1;
