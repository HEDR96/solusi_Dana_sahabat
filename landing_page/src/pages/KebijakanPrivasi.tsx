export default function KebijakanPrivasi() {
  return (
    <>
      {/* Hero */}
      <div className="pt-24 pb-14" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase" style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}>
            Legal
          </span>
          <h1 className="text-4xl lg:text-5xl font-normal text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Kebijakan Privasi
          </h1>
          <p className="text-blue-200">
            Terakhir diperbarui: 11 Juli 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate max-w-none" style={{ color: '#374151', lineHeight: '1.8' }}>

            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Solusi Dana Sahabat (<strong>"kami"</strong>) berkomitmen melindungi privasi setiap pengguna layanan dan aplikasi kami.
              Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak-hak Anda atas data tersebut.
            </p>

            {[
              {
                title: '1. Data yang Kami Kumpulkan',
                content: [
                  {
                    sub: 'a. Data yang Anda berikan secara langsung',
                    items: [
                      'Nama lengkap, nomor KTP, dan tanggal lahir',
                      'Nomor telepon dan alamat email',
                      'Alamat tempat tinggal',
                      'Informasi kendaraan (merek, tahun, nomor BPKB/STNK)',
                      'Data rekening bank (untuk pencairan dan komisi agen)',
                    ],
                  },
                  {
                    sub: 'b. Data yang dikumpulkan otomatis (Aplikasi Android)',
                    items: [
                      'Lokasi GPS (hanya saat aplikasi aktif di foreground, dengan izin eksplisit)',
                      'Informasi perangkat: model, versi OS Android, dan ID instalasi unik',
                      'Log aktivitas dalam aplikasi untuk keperluan teknis dan keamanan',
                    ],
                  },
                ],
              },
              {
                title: '2. Tujuan Penggunaan Data',
                plain: `Kami menggunakan data yang dikumpulkan semata-mata untuk keperluan berikut:`,
                items: [
                  'Memproses dan menindaklanjuti pengajuan pinjaman dana BPKB',
                  'Menghubungi Anda terkait status pengajuan melalui telepon, WhatsApp, atau email',
                  'Mengelola akun agen dan menghitung komisi yang menjadi hak agen',
                  'Meningkatkan kualitas layanan dan pengalaman pengguna aplikasi',
                  'Memenuhi kewajiban hukum dan peraturan yang berlaku di Indonesia',
                  'Menampilkan lokasi agen aktif pada fitur Peta Agen (khusus pengguna internal)',
                ],
              },
              {
                title: '3. Berbagi Data dengan Pihak Ketiga',
                plain: `Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak ketiga. Data Anda hanya dibagikan kepada:`,
                items: [
                  'Mitra leasing terkait (OTO Finance, Adira, FIF, dll.) dalam rangka proses pengajuan pinjaman yang Anda ajukan',
                  'Penyedia infrastruktur teknis kami (Supabase untuk database, Vercel untuk hosting) yang terikat perjanjian kerahasiaan',
                  'Instansi pemerintah atau penegak hukum apabila diwajibkan oleh peraturan perundang-undangan',
                ],
              },
              {
                title: '4. Keamanan Data',
                plain: `Kami menerapkan langkah-langkah teknis dan organisasi yang wajar untuk melindungi data Anda, antara lain:`,
                items: [
                  'Enkripsi data saat transit menggunakan protokol HTTPS/TLS',
                  'Autentikasi berbasis token JWT dengan masa berlaku terbatas',
                  'Akses database dibatasi berdasarkan peran (role-based access control)',
                  'Data sensitif tidak disimpan secara lokal di perangkat pengguna',
                ],
              },
              {
                title: '5. Penyimpanan dan Retensi Data',
                plain: `Data pribadi Anda disimpan selama akun Anda aktif atau selama diperlukan untuk memenuhi tujuan yang tercantum dalam kebijakan ini. Setelah akun dihapus atau tidak aktif selama 3 (tiga) tahun, data akan dianonimkan atau dihapus secara permanen, kecuali diwajibkan hukum untuk disimpan lebih lama.`,
              },
              {
                title: '6. Hak-Hak Anda',
                plain: `Anda memiliki hak-hak berikut atas data pribadi Anda:`,
                items: [
                  'Hak akses: meminta salinan data pribadi yang kami simpan tentang Anda',
                  'Hak koreksi: meminta perbaikan data yang tidak akurat atau tidak lengkap',
                  'Hak penghapusan: meminta penghapusan data Anda, dengan pengecualian kewajiban hukum',
                  'Hak penarikan izin: menarik kembali persetujuan pemrosesan data sewaktu-waktu',
                  'Hak pembatasan: meminta pembatasan pemrosesan data dalam kondisi tertentu',
                ],
              },
              {
                title: '7. Izin Aplikasi Android',
                plain: `Aplikasi Android Solusi Dana Sahabat meminta izin berikut pada perangkat Anda:`,
                items: [
                  'Lokasi (ACCESS_FINE_LOCATION) — untuk fitur Peta Agen dan verifikasi kehadiran. Izin ini bersifat opsional; aplikasi tetap berfungsi tanpa izin lokasi',
                  'Internet (INTERNET) — untuk komunikasi dengan server dalam rangka sinkronisasi data',
                  'Notifikasi (POST_NOTIFICATIONS, Android 13+) — untuk pemberitahuan status pengajuan dan jadwal survey',
                ],
              },
              {
                title: '8. Cookie dan Teknologi Pelacakan',
                plain: `Situs web kami (solusidanasahabat.com) menggunakan cookie sesi untuk menjaga status login dan meningkatkan pengalaman pengguna. Kami tidak menggunakan cookie pihak ketiga untuk tujuan periklanan. Anda dapat menonaktifkan cookie melalui pengaturan browser, namun beberapa fitur situs mungkin tidak berfungsi optimal.`,
              },
              {
                title: '9. Privasi Anak-Anak',
                plain: `Layanan kami tidak ditujukan untuk anak-anak di bawah usia 17 (tujuh belas) tahun. Kami tidak secara sengaja mengumpulkan data pribadi dari anak-anak. Apabila Anda mendapati bahwa anak di bawah umur telah memberikan data kepada kami, harap segera hubungi kami untuk penghapusan data tersebut.`,
              },
              {
                title: '10. Perubahan Kebijakan',
                plain: `Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan material akan diberitahukan melalui email terdaftar atau pemberitahuan di aplikasi setidaknya 14 (empat belas) hari sebelum berlaku. Penggunaan layanan secara berkelanjutan setelah tanggal berlaku merupakan persetujuan terhadap perubahan tersebut.`,
              },
              {
                title: '11. Hubungi Kami',
                plain: `Untuk pertanyaan, permintaan akses data, atau keluhan terkait privasi, silakan hubungi kami melalui:`,
                items: [
                  'Email: privacy@solusidanasahabat.com',
                  'WhatsApp: 0812-3456-7890',
                  'Alamat: Jl. Contoh No. 1, Medan, Sumatera Utara, Indonesia',
                ],
              },
            ].map((section) => (
              <div key={section.title} style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0c2461', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  {section.title}
                </h2>
                {section.plain && (
                  <p style={{ color: '#4b5563', marginBottom: '0.75rem' }}>{section.plain}</p>
                )}
                {section.content && section.content.map((block) => (
                  <div key={block.sub} style={{ marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>{block.sub}</p>
                    <ul style={{ paddingLeft: '1.25rem', color: '#6b7280' }}>
                      {block.items.map((item, i) => (
                        <li key={i} style={{ marginBottom: '0.35rem', listStyleType: 'disc' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {section.items && (
                  <ul style={{ paddingLeft: '1.25rem', color: '#6b7280' }}>
                    {section.items.map((item, i) => (
                      <li key={i} style={{ marginBottom: '0.4rem', listStyleType: 'disc' }}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Footer note */}
            <div style={{ background: '#f0f4ff', border: '1px solid #c7d7f8', borderRadius: '12px', padding: '1.25rem 1.5rem', marginTop: '3rem' }}>
              <p style={{ color: '#1e3a8a', fontSize: '0.875rem', margin: 0, lineHeight: '1.7' }}>
                <strong>Catatan:</strong> Kebijakan privasi ini berlaku untuk seluruh layanan Solusi Dana Sahabat, termasuk situs web, aplikasi Android, dan sistem ERP internal. Kebijakan ini disusun mengacu pada Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP) Republik Indonesia.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
