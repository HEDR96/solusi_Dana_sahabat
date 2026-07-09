export default function Services() {
  return (
    <section id="layanan" className="py-20 lg:py-28" style={{ background: '#f8faff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase"
            style={{ background: 'rgba(12,36,97,0.08)', color: 'var(--navy-deep)' }}
          >
            Produk Kami
          </span>
          <h2 className="text-3xl lg:text-4xl font-normal mb-4" style={{ color: 'var(--navy-deep)' }}>
            Layanan Fasilitas Dana BPKB
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Kami menyediakan dua jenis fasilitas pinjaman dana jaminan BPKB yang dapat disesuaikan dengan kebutuhan Anda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card Motor */}
          <div
            className="relative rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            style={{ border: '1px solid var(--border)' }}
          >
            <div className="h-48 relative overflow-hidden" style={{ background: '#1e3a8a' }}>
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop&auto=format"
                alt="Pinjaman dana jaminan BPKB motor"
                className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,36,97,0.8) 0%, transparent 60%)' }} />
              <div
                className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold text-white"
                style={{ background: 'var(--gold)' }}
              >
                🏍️ BPKB Motor
              </div>
            </div>
            <div className="p-6 bg-white">
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>
                Pinjaman Dana Jaminan BPKB Motor
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Ajukan fasilitas dana dengan jaminan BPKB motor. Cocok untuk kebutuhan modal usaha, biaya pendidikan, renovasi, atau kebutuhan mendesak lainnya. Proses dibantu oleh tim profesional kami.
              </p>
              <ul className="space-y-2 mb-6">
                {['Bisa motor berbagai merek', 'Proses pengajuan mudah', 'Dibantu ke pihak leasing', 'Konsultasi gratis'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0" style={{ background: 'var(--navy-deep)' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#simulasi"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:gap-3"
                style={{ color: 'var(--navy-deep)' }}
              >
                Cek Kelayakan Pengajuan →
              </a>
            </div>
          </div>

          {/* Card Mobil */}
          <div
            className="relative rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            style={{ border: '1px solid var(--border)' }}
          >
            <div className="h-48 relative overflow-hidden" style={{ background: '#0c2461' }}>
              <img
                src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=300&fit=crop&auto=format"
                alt="Pinjaman dana jaminan BPKB mobil"
                className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,36,97,0.8) 0%, transparent 60%)' }} />
              <div
                className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold text-white"
                style={{ background: 'var(--gold)' }}
              >
                🚙 BPKB Mobil
              </div>
            </div>
            <div className="p-6 bg-white">
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>
                Pinjaman Dana Jaminan BPKB Mobil
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Dapatkan fasilitas dana lebih besar dengan jaminan BPKB mobil. Proses dibantu oleh tim kami hingga pengajuan ke leasing, dengan pilihan leasing yang beragam sesuai kebutuhan.
              </p>
              <ul className="space-y-2 mb-6">
                {['Nilai pinjaman lebih besar', 'Bebas berbagai merek mobil', 'Survey dibantu tim agen', 'Banyak pilihan leasing'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0" style={{ background: 'var(--gold)' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#simulasi"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:gap-3"
                style={{ color: 'var(--navy-deep)' }}
              >
                Cek Kelayakan Pengajuan →
              </a>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {[
            { icon: '🔒', label: 'Data Aman' },
            { icon: '💬', label: 'Konsultasi Gratis' },
            { icon: '📋', label: 'Proses Sesuai Ketentuan Leasing' },
            { icon: '🌍', label: 'Layanan Seluruh Indonesia' },
          ].map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--navy-deep)' }}
            >
              <span>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
