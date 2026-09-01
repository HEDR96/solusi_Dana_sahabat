-- Notifikasi "Berkas Baru" di aplikasi Android tidak bisa dibuka ke detail
-- berkas terkait karena dsd_notifications tidak menyimpan id berkasnya —
-- cuma "link" generik ke halaman web ("/applications"), bukan berkas spesifik.
alter table dsd_notifications add column if not exists app_id text;
