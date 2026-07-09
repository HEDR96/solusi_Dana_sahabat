import { Link } from 'react-router'

const services = [
  {
    type: 'motor',
    label: 'BPKB Motor',
    title: 'Pinjaman Dana Jaminan BPKB Motor',
    desc: 'Ajukan fasilitas dana dengan jaminan BPKB motor untuk modal usaha, biaya pendidikan, renovasi, atau kebutuhan mendesak lainnya. Proses dibantu penuh oleh tim agen profesional kami.',
    features: [
      'Motor berbagai merek & tahun',
      'Proses pengajuan mudah',
      'Dibantu ke pihak leasing',
      'Konsultasi gratis tanpa syarat',
    ],
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop&auto=format',
    accent: '#0c2461',
    badge: { bg: 'linear-gradient(135deg,#f59e0b,#e8a020)', text: '#fff' },
    iconBg: 'rgba(12,36,97,0.08)',
    checkColor: '#0c2461',
  },
  {
    type: 'mobil',
    label: 'BPKB Mobil',
    title: 'Pinjaman Dana Jaminan BPKB Mobil',
    desc: 'Dapatkan fasilitas dana lebih besar dengan jaminan BPKB mobil. Tim agen kami mendampingi dari awal pengajuan hingga proses survey leasing, dengan berbagai pilihan leasing terpercaya.',
    features: [
      'Nilai pinjaman lebih besar',
      'Bebas berbagai merek mobil',
      'Survey dibantu tim agen',
      'Banyak pilihan leasing resmi',
    ],
    img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=300&fit=crop&auto=format',
    accent: '#1d4ed8',
    badge: { bg: 'linear-gradient(135deg,#f59e0b,#e8a020)', text: '#fff' },
    iconBg: 'rgba(29,78,216,0.08)',
    checkColor: '#e8a020',
  },
]

const trustBadges = [
  { label: 'Data Aman & Terjaga' },
  { label: 'Konsultasi Gratis' },
  { label: 'Proses Sesuai Ketentuan Leasing' },
  { label: 'Layanan Seluruh Indonesia' },
]

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <circle cx="8" cy="8" r="8" fill={color} opacity={0.12} />
      <path d="M4.5 8l2.5 2.5 4.5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Services() {
  return (
    <section id="layanan" className="py-20 lg:py-28" style={{ background: 'linear-gradient(180deg, #f8faff 0%, #ffffff 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
            style={{ background: 'rgba(12,36,97,0.07)', color: 'var(--navy-deep)', border: '1px solid rgba(12,36,97,0.1)' }}
          >
            Produk Kami
          </span>
          <h2
            className="text-3xl lg:text-4xl font-normal mb-4 leading-tight"
            style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}
          >
            Layanan Fasilitas Dana BPKB
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Dua produk fasilitas pinjaman dana jaminan BPKB yang dapat disesuaikan dengan kebutuhan dan jenis kendaraan Anda.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {services.map((s) => (
            <div
              key={s.type}
              className="rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 flex flex-col"
              style={{ border: '1px solid #e8edf5', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', background: 'white' }}
            >
              {/* Image area */}
              <div className="relative h-52 overflow-hidden" style={{ background: s.accent }}>
                <img
                  src={s.img}
                  alt={s.title}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${s.accent}cc 0%, transparent 55%)` }} />

                {/* Badge */}
                <div
                  className="absolute bottom-4 left-5 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-white shadow-lg"
                  style={{ background: s.badge.bg }}
                >
                  {s.type === 'motor' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h11l5 5H3"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M16 7l-4-4H6L2 7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                  )}
                  {s.label}
                </div>

                {/* Top pill */}
                <div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  Tersedia Seluruh Indonesia
                </div>
              </div>

              {/* Content */}
              <div className="p-7 flex flex-col flex-1">
                <h3
                  className="text-xl font-semibold mb-3 leading-snug"
                  style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}
                >
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  {s.desc}
                </p>

                <ul className="space-y-2.5 mb-7">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <CheckIcon color={s.checkColor} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5 flex items-center justify-between" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <Link
                    to="/simulasi"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)', boxShadow: '0 2px 12px rgba(12,36,97,0.25)' }}
                  >
                    Ajukan Sekarang
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 7h10M7 2l5 5-5 5"/></svg>
                  </Link>
                  <Link
                    to="/layanan"
                    className="text-sm font-semibold transition-colors hover:underline"
                    style={{ color: 'var(--navy-deep)' }}
                  >
                    Info Lengkap →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          {trustBadges.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium transition-shadow hover:shadow-md"
              style={{ background: 'white', border: '1px solid #e8edf5', color: '#334155', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="7" fill="#0c2461" opacity="0.1"/>
                <path d="M3.5 7l2.5 2.5 4.5-5" stroke="#0c2461" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
