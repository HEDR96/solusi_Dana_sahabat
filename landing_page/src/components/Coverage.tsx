const areas = [
  'Jabodetabek', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta',
  'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Lampung', 'Sumatera Selatan',
  'Kalimantan Barat', 'Kalimantan Timur', 'Kalimantan Selatan', 'Kalimantan Tengah',
  'Sulawesi Selatan', 'Sulawesi Utara', 'Sulawesi Tengah',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Papua', 'Maluku', 'Dan wilayah lainnya',
]

export default function Coverage() {
  return (
    <section
      id="area-layanan"
      className="py-20 lg:py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0c2461 0%, #1e3a8a 100%)' }}
    >
      {/* Decoration */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, #e8a020, transparent 70%)', transform: 'translate(25%, -25%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase"
              style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}
            >
              Jangkauan Layanan
            </span>
            <h2 className="text-3xl lg:text-4xl font-normal text-white mb-5">
              Tersedia untuk Seluruh Indonesia
            </h2>
            <p className="text-blue-200 leading-relaxed mb-8">
              Solusi Dana Sahabat melayani pengajuan fasilitas pinjaman dana BPKB motor dan mobil dari berbagai wilayah di Indonesia melalui jaringan agen dan mitra leasing kami yang tersebar luas.
            </p>

            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: area === 'Dan wilayah lainnya' ? 'rgba(232,160,32,0.2)' : 'rgba(255,255,255,0.1)',
                    color: area === 'Dan wilayah lainnya' ? 'var(--gold-light)' : '#bfdbfe',
                    border: `1px solid ${area === 'Dan wilayah lainnya' ? 'rgba(232,160,32,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {area !== 'Dan wilayah lainnya' && '📍 '}{area}
                </span>
              ))}
            </div>
          </div>

          {/* Right — SVG Indonesia Map approximation */}
          <div className="flex flex-col items-center">
            {/* Stylized map representation */}
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', height: 320 }}
            >
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=350&fit=crop&auto=format&q=60"
                alt="Layanan pinjaman BPKB seluruh Indonesia"
                className="w-full h-full object-cover opacity-20"
              />
              {/* Overlay map dots */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-3">🗺️</div>
                  <div className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>
                    34 Provinsi
                  </div>
                  <div className="text-blue-200 text-sm">Jaringan agen tersebar di seluruh nusantara</div>
                </div>
              </div>

              {/* Pulse dots on map */}
              {[
                { top: '30%', left: '18%', label: 'Sumatera' },
                { top: '55%', left: '38%', label: 'Jawa' },
                { top: '40%', left: '58%', label: 'Kalimantan' },
                { top: '55%', left: '72%', label: 'Sulawesi' },
                { top: '65%', left: '85%', label: 'Papua' },
              ].map((dot) => (
                <div
                  key={dot.label}
                  className="absolute flex flex-col items-center"
                  style={{ top: dot.top, left: dot.left }}
                >
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full animate-ping absolute" style={{ background: 'var(--gold)', opacity: 0.5 }} />
                    <div className="w-3 h-3 rounded-full relative" style={{ background: 'var(--gold)' }} />
                  </div>
                  <div className="text-xs text-yellow-300 mt-1 font-medium whitespace-nowrap">{dot.label}</div>
                </div>
              ))}
            </div>

            {/* Numbers */}
            <div className="grid grid-cols-3 gap-4 w-full mt-6">
              {[
                { val: '34+', label: 'Provinsi' },
                { val: '100+', label: 'Kota/Kab' },
                { val: '10+', label: 'Mitra Leasing' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center py-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <div className="text-xl font-bold mb-1" style={{ color: 'var(--gold-light)', fontFamily: 'DM Serif Display, serif' }}>{s.val}</div>
                  <div className="text-xs text-blue-200">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
