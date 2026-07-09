const advantages = [
  {
    icon: '📝',
    title: 'Proses Pengajuan Mudah',
    desc: 'Isi form online, tim kami segera menghubungi dan memandu Anda melalui setiap langkah pengajuan.',
  },
  {
    icon: '🌍',
    title: 'Tersedia di Seluruh Indonesia',
    desc: 'Layanan kami menjangkau seluruh wilayah Indonesia melalui jaringan agen dan mitra leasing kami.',
  },
  {
    icon: '🏦',
    title: 'Banyak Mitra Leasing',
    desc: 'Bekerja sama dengan berbagai leasing terpercaya sehingga pilihan dan peluang persetujuan lebih luas.',
  },
  {
    icon: '🤝',
    title: 'Dibantu Sampai Proses Survey',
    desc: 'Tim agen profesional mendampingi dari awal pengajuan hingga proses survey dan serah terima dokumen.',
  },
  {
    icon: '🚗',
    title: 'Cocok untuk Motor dan Mobil',
    desc: 'Menerima pengajuan dengan jaminan BPKB motor maupun mobil dari berbagai merek dan tahun kendaraan.',
  },
  {
    icon: '👔',
    title: 'Tim Agen Profesional',
    desc: 'Agen kami terlatih, berpengalaman, dan siap memberikan layanan konsultasi terbaik untuk Anda.',
  },
]

export default function Advantages() {
  return (
    <section id="keunggulan" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — image */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl overflow-hidden" style={{ height: 460, background: '#0c2461' }}>
              <img
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=500&fit=crop&auto=format"
                alt="Tim profesional Solusi Dana Sahabat siap membantu pengajuan fasilitas dana BPKB"
                className="w-full h-full object-cover opacity-85"
              />
            </div>
            {/* Floating card */}
            <div
              className="absolute -right-8 top-10 px-5 py-4 rounded-2xl shadow-2xl"
              style={{ background: 'white', border: '1px solid var(--border)', maxWidth: 220 }}
            >
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-sm font-bold text-gray-800 mb-0.5">Dipercaya Nasabah</div>
              <div className="text-xs text-gray-400">Ribuan pengajuan telah diproses di seluruh Indonesia</div>
            </div>
            <div
              className="absolute -left-6 bottom-10 px-5 py-4 rounded-2xl shadow-2xl"
              style={{ background: 'var(--navy-deep)', maxWidth: 210 }}
            >
              <div className="text-2xl mb-1">📊</div>
              <div className="text-sm font-bold text-white mb-0.5">Leasing Terpercaya</div>
              <div className="text-xs text-blue-200">Bekerja sama dengan 10+ leasing resmi nasional</div>
            </div>
          </div>

          {/* Right — grid */}
          <div>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase"
              style={{ background: 'rgba(12,36,97,0.08)', color: 'var(--navy-deep)' }}
            >
              Keunggulan Kami
            </span>
            <h2 className="text-3xl lg:text-4xl font-normal mb-4" style={{ color: 'var(--navy-deep)' }}>
              Mengapa Memilih Solusi Dana Sahabat?
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed">
              Solusi Dana Sahabat hadir sebagai mitra terpercaya yang membantu proses fasilitas dana BPKB motor dan mobil dengan layanan profesional dari awal hingga dana cair.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              {advantages.map((a) => (
                <div
                  key={a.title}
                  className="p-4 rounded-xl flex gap-4 group hover:shadow-md transition-all"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(12,36,97,0.08)' }}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--navy-deep)' }}>{a.title}</h3>
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
