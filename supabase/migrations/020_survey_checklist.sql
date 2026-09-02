-- ============================================================================
-- Checklist survey terstruktur
-- ============================================================================
-- Hasil survey selama ini hanya kolom teks bebas (survey_result), sehingga
-- tidak bisa dibandingkan antar berkas, tidak bisa difilter, dan kualitasnya
-- bergantung sepenuhnya pada seberapa rajin petugas menulis. Padahal inilah
-- dasar keputusan komite untuk menyetujui atau menolak pinjaman.
--
-- Yang ditambahkan: jawaban terstruktur (jsonb) + satu kesimpulan rekomendasi
-- yang bisa dihitung/difilter. survey_result TETAP DIPAKAI untuk catatan
-- naratif — hal yang tidak tertangkap checklist justru sering yang paling
-- penting, jadi jangan dihilangkan.

alter table dsd_applications
  add column if not exists survey_checklist      jsonb,
  add column if not exists survey_recommendation text,
  add column if not exists survey_by             text,
  add column if not exists survey_filled_at      timestamptz;

do $$
begin
  alter table dsd_applications
    add constraint dsd_applications_survey_recommendation_check
    check (survey_recommendation is null
           or survey_recommendation in ('layak', 'layak-bersyarat', 'tidak-layak'));
exception when duplicate_object then null;
end $$;

-- Dipakai untuk menyaring berkas yang sudah/belum disurvey dan rekapnya
create index if not exists idx_applications_survey_recommendation
  on dsd_applications (survey_recommendation) where survey_recommendation is not null;

-- ---------------------------------------------------------------------------
-- Jejak siapa & kapan mengisi survey — diisi server, bukan client.
-- ---------------------------------------------------------------------------
-- Rekomendasi survey ikut menentukan disetujui/tidaknya pinjaman, jadi harus
-- jelas siapa yang bertanggung jawab atasnya. Pola sama seperti migration 018:
-- nilai kiriman client tidak dipercaya.
create or replace function dsd_stamp_survey()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if (new.survey_checklist is distinct from old.survey_checklist
      or new.survey_recommendation is distinct from old.survey_recommendation)
     and uid is not null then
    new.survey_by := coalesce(
      nullif((select name from dsd_profiles where id = uid), ''),
      (select email from dsd_profiles where id = uid),
      uid::text
    );
    new.survey_filled_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_survey on dsd_applications;
create trigger trg_stamp_survey
  before update on dsd_applications
  for each row execute function dsd_stamp_survey();
