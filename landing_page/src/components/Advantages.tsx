const advantages = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Proses Pengajuan Mudah',
    desc: 'Isi form online, tim kami segera menghubungi dan memandu Anda melalui setiap langkah pengajuan hingga selesai.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="9"/><path d="M2 12h4M16 12h4M11 2v4M11 16v4" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Tersedia di Seluruh Indonesia',
    desc: 'Layanan kami menjangkau 34+ provinsi di Indonesia melalui jaringan agen dan mitra leasing yang tersebar luas.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10h18M3 14h18M3 18h18M3 6h18" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Banyak Mitra Leasing',
    desc: 'Bekerja sama dengan 10+ leasing terpercaya sehingga pilihan lebih luas dan peluang persetujuan lebih tinggi.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Didampingi Sampai Survey',
    desc: 'Tim agen profesional mendampingi dari awal pengajuan hingga proses survey dan serah terima dokumen di leasing.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Data Aman & Terpercaya',
    desc: 'Keamanan data nasabah menjadi prioritas utama kami. Informasi Anda dijaga ketat sesuai ketentuan yang berlaku.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/><path d="M2 20s2-4 10-4 10 4 10 4" strokeLinecap="round"/>
        <path d="M16 3.13a4 4 0 010 5.74" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Tim Agen Profesional',
    desc: 'Agen kami terlatih, berpengalaman, dan berdedikasi memberikan layanan konsultasi terbaik dengan respons cepat.',
  },
]

export default function Advantages() {
  return (
    <section id="keunggulan" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — image stack */}
          <div className="relative hidden lg:block">
            {/* Main image */}
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{ height: 500, boxShadow: '0 30px 80px rgba(12,36,97,0.18)' }}
            >
              <img
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=700&h=600&fit=crop&auto=format"
                alt="Tim profesional Solusi Dana Sahabat membantu pengajuan fasilitas dana BPKB"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(12,36,97,0.3) 0%, transparent 60%)' }} />
            </div>

            {/* Floating card — top right */}
            <div
              className="absolute -right-8 top-10 p-5 rounded-2xl shadow-2xl"
              style={{ background: 'white', border: '1px solid #e8edf5', maxWidth: 230 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.12)' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#f59e0b">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#0c2461' }}>4.8 / 5 Rating</div>
                  <div className="text-xs text-gray-400">dari ribuan nasabah</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Dipercaya lebih dari 5.000 pengajuan berhasil diproses di seluruh Indonesia.
              </p>
            </div>

            {/* Floating card — bottom left */}
            <div
              className="absolute -left-8 bottom-12 p-5 rounded-2xl shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #071640, #0c2461)', maxWidth: 225, border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,160,32,0.15)' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#f59e0b" strokeWidth="1.8">
                    <path d="M3 10h12M3 14h7M3 6h12" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="text-sm font-bold text-white">10+ Mitra Leasing</div>
              </div>
              <p className="text-xs text-blue-200 leading-relaxed">Leasing resmi berskala nasional tersedia untuk pilihan terbaik Anda.</p>
            </div>

            {/* Accent dot */}
            <div
              className="absolute top-1/2 -left-3 w-6 h-6 rounded-full"
              style={{ background: 'var(--gold)', boxShadow: '0 0 20px rgba(232,160,32,0.5)' }}
            />
          </div>

          {/* Right — content */}
          <div>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
              style={{ background: 'rgba(12,36,97,0.07)', color: 'var(--navy-deep)', border: '1px solid rgba(12,36,97,0.1)' }}
            >
              Keunggulan Kami
            </span>
            <h2
              className="text-3xl lg:text-4xl font-normal mb-4 leading-tight"
              style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}
            >
              Mengapa Memilih Solusi Dana Sahabat?
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed">
              Kami hadir sebagai mitra terpercaya yang membantu proses fasilitas dana BPKB motor dan mobil dengan layanan profesional dari awal hingga dana cair.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {advantages.map((a, i) => (
                <div
                  key={a.title}
                  className="p-4 rounded-2xl flex gap-4 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  style={{
                    background: i === 0 ? 'linear-gradient(135deg, rgba(12,36,97,0.04), rgba(29,78,216,0.04))' : 'white',
                    border: i === 0 ? '1px solid rgba(12,36,97,0.12)' : '1px solid #f1f5f9',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{ background: 'rgba(12,36,97,0.07)', color: 'var(--navy-deep)' }}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1 leading-snug" style={{ color: 'var(--navy-deep)' }}>
                      {a.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
