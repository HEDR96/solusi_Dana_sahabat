const testimonials = [
  {
    name: 'Budi Santoso',
    role: 'Pemilik UMKM Kuliner',
    city: 'Jakarta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
    text: 'Proses pengajuan BPKB motor saya dibantu penuh dari awal sampai akhir. Tim agennya sangat responsif dan profesional. Dana cair tepat waktu untuk modal usaha saya.',
    rating: 5,
    badge: 'Nasabah BPKB Motor',
    badgeColor: '#0c2461',
  },
  {
    name: 'Dewi Rahmawati',
    role: 'Ibu Rumah Tangga',
    city: 'Surabaya',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&auto=format',
    text: 'Butuh dana mendesak untuk biaya pendidikan anak. Alhamdulillah dengan jaminan BPKB mobil, prosesnya tidak berbelit. Tim Solusi Dana Sahabat sangat membantu dan transparan.',
    rating: 5,
    badge: 'Nasabah BPKB Mobil',
    badgeColor: '#1d4ed8',
  },
  {
    name: 'Rizki Firmansyah',
    role: 'Agen Mitra',
    city: 'Bandung',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format',
    text: 'Sudah 6 bulan bergabung sebagai agen. Komisi menarik, sistem supportnya bagus, dan bisa kerja fleksibel dari mana saja. Produknya banyak dibutuhkan masyarakat.',
    rating: 5,
    badge: 'Agen Mitra',
    badgeColor: '#e8a020',
  },
]

const trustStats = [
  { val: '5.000+', label: 'Pengajuan Diproses' },
  { val: '4.8/5', label: 'Rating Kepuasan' },
  { val: '34+', label: 'Provinsi Terlayani' },
  { val: '500+', label: 'Agen Aktif' },
]

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill={i < n ? '#fbbf24' : '#e2e8f0'}>
          <path d="M7 1l1.55 3.25L12 4.85l-2.5 2.5.6 3.65L7 9.25l-3.1 1.75.6-3.65L2 4.85l3.45-.6L7 1z"/>
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section
      id="testimoni"
      className="py-20 lg:py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}
    >
      {/* Decorative blob */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(12,36,97,0.04) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-widest uppercase"
            style={{ background: 'rgba(12,36,97,0.07)', color: 'var(--navy-deep)' }}
          >
            Testimoni
          </span>
          <h2
            className="text-3xl lg:text-4xl font-normal mb-4"
            style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}
          >
            Dipercaya Ribuan Nasabah & Agen
          </h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            Pengalaman nyata dari nasabah dan agen yang telah mempercayakan kebutuhan fasilitas
            dana BPKB mereka kepada Solusi Dana Sahabat.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl flex flex-col gap-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-7"
              style={{ background: 'white', border: '1px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
            >
              {/* Quote icon */}
              <div className="text-3xl" style={{ color: 'rgba(12,36,97,0.08)', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
                "
              </div>

              <Stars n={t.rating} />

              <p className="text-[14px] text-gray-600 leading-relaxed flex-1">
                {t.text}
              </p>

              <div
                className="pt-5 flex items-center justify-between"
                style={{ borderTop: '1px solid #f1f5f9' }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                    style={{ border: '2px solid #e2e8f0' }}
                  />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--navy-deep)' }}>{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}, {t.city}</div>
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ background: t.badgeColor }}
                >
                  {t.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust stats bar */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #071640, #0c2461)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4">
            {trustStats.map((s, i) => (
              <div
                key={s.label}
                className="py-8 text-center px-6"
                style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                <div
                  className="text-3xl font-bold mb-1.5"
                  style={{ color: '#fbbf24', fontFamily: 'DM Serif Display, serif' }}
                >
                  {s.val}
                </div>
                <div className="text-xs" style={{ color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
