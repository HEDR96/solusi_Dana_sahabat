# Solusi Dana Sahabat — ERP Multifinance

Satu repo berisi **web dashboard** dan **aplikasi Android**, terhubung ke database Supabase yang sama.

## Struktur

```
├── src/                  ← Web ERP (React + Vite), deploy otomatis ke Vercel
│   ├── pages/            ← Halaman (Dashboard, Berkas, Agen, Komisi, Peta, Master Data, ...)
│   ├── context/          ← AppContext.jsx — semua panggilan Supabase web lewat sini
│   ├── components/       ← Layout (Sidebar, Topbar) + komponen UI
│   ├── data/permissions.js ← Hak akses per role (owner, spv-agen, agen, dst.)
│   └── utils/            ← Hook & helper (useMasterOptions, exportCsv, ...)
├── api/
│   └── gdrive.js         ← Vercel serverless: upload/list dokumen ke Google Drive
├── supabase/migrations/  ← SQL yang harus dijalankan di Supabase SQL Editor (urut 001→004)
└── android/              ← Aplikasi Android (Kotlin + MVVM)
    └── app/src/main/
        ├── java/com/solusidana/sahabat/
        │   ├── data/     ← SupabaseApi.kt (semua panggilan API), model, session, master data
        │   ├── ui/       ← Layar per fitur (login, dashboard, agents, applications,
        │   │               commission, activities, profile, masterdata, lock, simulation)
        │   └── worker/   ← Notifikasi background (3 jam, survey pagi, sync draft offline)
        └── res/          ← Layout XML, navigasi, tema (values-night = dark mode)
```

## Cara kerja

**Web** — `npm run dev` untuk lokal, push ke `master` = deploy otomatis Vercel.

**Android** — buka folder `android/` di Android Studio, atau:
```
cd android
.\gradlew.bat assembleDebug     # hasil: android/app/build/outputs/apk/debug/app-debug.apk
```

## Aturan penting

- Kunci sensitif (`SUPABASE_SERVICE_ROLE_KEY`, key service account GDrive) **tidak boleh
  di-commit** — hanya di Vercel Environment Variables / `.env.local` (gitignored).
- Frontend & APK hanya boleh pakai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
- Role scoping ada dua lapis: filter di app (`visibleAgents/Applications/...`) dan
  RLS di database (`supabase/migrations/001_rls_policies.sql`).
- Dropdown (tipe unit, tenor, bank, metode bayar) dikelola dari menu **Master Data**
  (web & APK, khusus owner) — jangan hardcode nilai baru di kode.
