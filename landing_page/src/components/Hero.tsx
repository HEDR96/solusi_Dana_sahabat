const badges = [
  { icon: '🌐', text: 'Tersedia Seluruh Indonesia' },
  { icon: '🏦', text: 'Banyak Pilihan Leasing' },
  { icon: '⚡', text: 'Proses Cepat & Aman' },
  { icon: '🚗', text: 'Motor & Mobil Bisa Diajukan' },
]

export default function Hero() {
  return (
    <section
      id="beranda"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #071640 0%, #0c2461 45%, #1e3a8a 100%)',
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #e8a020 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-8 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
      />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--gold-light)', border: '1px solid rgba(232,160,32,0.3)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Layanan Fasilitas Dana Terpercaya
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-normal text-white leading-tight mb-6"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              Solusi Pinjaman Dana dengan Jaminan{' '}
              <span style={{ color: 'var(--gold-light)' }}>BPKB Motor & Mobil</span>
            </h1>

            <p className="text-blue-200 text-lg leading-relaxed mb-8 max-w-xl">
              Solusi Dana Sahabat membantu Anda mendapatkan fasilitas dana dengan proses mudah, cepat, dan tersedia di seluruh Indonesia melalui berbagai mitra leasing terpercaya.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a
                href="#simulasi"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: 'var(--gold)', boxShadow: '0 4px 20px rgba(232,160,32,0.4)' }}
              >
                <span>Ajukan Pinjaman Sekarang</span>
                <span>→</span>
              </a>
              <a
                href="#career"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white border border-white/30 hover:bg-white/10 transition-all"
              >
                Gabung Jadi Agen
              </a>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b) => (
                <div
                  key={b.text}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-sm text-blue-100 font-medium">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — image + floating cards */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 480, background: '#1e3a8a' }}>
              <img
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=700&h=500&fit=crop&auto=format"
                alt="Konsultan keuangan Solusi Dana Sahabat membantu pengajuan pinjaman BPKB"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,36,97,0.6) 0%, transparent 60%)' }} />
            </div>

            {/* Floating badge 1 */}
            <div
              className="absolute -left-6 top-12 px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl"
              style={{ background: 'white', minWidth: 180 }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: '#eff6ff' }}>🏍️</div>
              <div>
                <div className="text-xs text-gray-500">Jaminan BPKB Motor</div>
                <div className="text-sm font-bold text-gray-800">Mulai Rp 1 Juta</div>
              </div>
            </div>

            {/* Floating badge 2 */}
            <div
              className="absolute -right-4 bottom-20 px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl"
              style={{ background: 'white', minWidth: 190 }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: '#fff7ed' }}>🚙</div>
              <div>
                <div className="text-xs text-gray-500">Jaminan BPKB Mobil</div>
                <div className="text-sm font-bold text-gray-800">Dana Lebih Besar</div>
              </div>
            </div>

            {/* Floating badge 3 — Data Aman */}
            <div
              className="absolute left-8 bottom-6 px-4 py-2.5 rounded-full flex items-center gap-2 shadow-xl"
              style={{ background: 'rgba(12,36,97,0.9)', border: '1px solid rgba(232,160,32,0.4)' }}
            >
              <span className="text-yellow-400">🔒</span>
              <span className="text-sm text-white font-medium">Data Aman & Terjaga</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {[
            { value: '34+', label: 'Provinsi Terlayani' },
            { value: '10+', label: 'Mitra Leasing' },
            { value: '5.000+', label: 'Pengajuan Diproses' },
            { value: '24 Jam', label: 'Respons Tim Agen' },
          ].map((s) => (
            <div key={s.label} className="px-6 py-5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'DM Serif Display, serif', color: 'var(--gold-light)' }}>{s.value}</div>
              <div className="text-sm text-blue-200">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
