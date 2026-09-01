-- Owner butuh bisa hapus berkas dari APK. RLS di dsd_applications sebelumnya
-- tidak punya policy DELETE sama sekali — tanpa policy, Postgres RLS menolak
-- DELETE untuk SEMUA role (termasuk owner), bukan cuma yang tidak berwenang.
drop policy if exists dsd_applications_delete on dsd_applications;
create policy dsd_applications_delete on dsd_applications for delete to authenticated
  using (dsd_get_my_role() = 'owner');
