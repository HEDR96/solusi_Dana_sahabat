import { Link } from 'react-router'
import { blogPosts } from '../data/blogPosts'

const badges = [
  { text: 'Tersedia Seluruh Indonesia' },
  { text: 'Banyak Pilihan Leasing' },
  { text: 'Proses Cepat & Aman' },
  { text: 'Motor & Mobil Bisa Diajukan' },
]

const stats = [
  { value: '34+', label: 'Provinsi Terlayani' },
  { value: '10+', label: 'Mitra Leasing' },
  { value: '5.000+', label: 'Pengajuan Diproses' },
  { value: '< 24 Jam', label: 'Respons Tim Agen' },
]

const services = [
  {
    icon: '🏍️',
    label: 'BPKB Motor',
    title: 'Pinjaman BPKB Motor',
    desc: 'Fasilitas dana dengan jaminan BPKB motor untuk modal usaha, pendidikan, renovasi, dan kebutuhan lainnya.',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=280&fit=crop&auto=format',
  },
  {
    icon: '🚙',
    label: 'BPKB Mobil',
    title: 'Pinjaman BPKB Mobil',
    desc: 'Dana lebih besar dengan jaminan BPKB mobil, didampingi tim profesional hingga proses survey leasing.',
    img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&h=280&fit=crop&auto=format',
  },
]

const steps = [
  { num: '01', label: 'Isi Form', icon: '📝' },
  { num: '02', label: 'Tim Hubungi', icon: '📞' },
  { num: '03', label: 'Cek Dokumen', icon: '📋' },
  { num: '04', label: 'Survey Leasing', icon: '🔍' },
  { num: '05', label: 'Dana Cair', icon: '✅' },
]

const featuredPosts = blogPosts.slice(0, 3)

const categoryColor: Record<string, string> = {
  'Panduan': '#0c2461',
  'Tips': '#059669',
  'Simulasi': '#7c3aed',
  'Dokumen': '#d97706',
  'Perbandingan': '#dc2626',
}

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #030d1e 0%, #071640 40%, #0c2461 75%, #1a3a8a 100%)' }}
      >
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(232,160,32,0.07) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-7"
                style={{ background: 'rgba(232,160,32,0.14)', color: '#fbbf24', border: '1px solid rgba(232,160,32,0.3)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Layanan Fasilitas Dana Terpercaya
              </div>

              <h1
                className="font-normal text-white leading-tight mb-6"
                style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
              >
                Solusi Pinjaman Dana
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Jaminan BPKB
                </span>
                <br />
                Motor & Mobil
              </h1>

              <p className="text-blue-200 text-lg leading-relaxed mb-8 max-w-lg">
                Solusi Dana Sahabat membantu Anda mendapatkan fasilitas dana dengan proses mudah, cepat, dan tersedia di seluruh Indonesia melalui berbagai mitra leasing terpercaya.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  to="/simulasi"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #e8a020)', boxShadow: '0 4px 24px rgba(232,160,32,0.45)' }}
                >
                  Ajukan Pinjaman Sekarang
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 8h10M8 3l5 5-5 5"/></svg>
                </Link>
                <Link
                  to="/career"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold text-white border transition-all hover:bg-white/10"
                  style={{ borderColor: 'rgba(255,255,255,0.25)' }}
                >
                  Gabung Jadi Agen
                </Link>
              </div>

              {/* Badge chips */}
              <div className="grid grid-cols-2 gap-2.5">
                {badges.map((b) => (
                  <div
                    key={b.text}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="7" fill="rgba(251,191,36,0.2)"/>
                      <path d="M3.5 7l2.5 2.5 4.5-5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm text-blue-100 font-medium">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — image */}
            <div className="relative hidden lg:block">
              {/* Decorative rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-full" style={{ width: 520, height: 520, border: '1px solid rgba(255,255,255,0.04)' }} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-full" style={{ width: 440, height: 440, border: '1px solid rgba(232,160,32,0.07)' }} />
              </div>

              <div
                className="rounded-3xl overflow-hidden relative"
                style={{ height: 480, boxShadow: '0 30px 80px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=700&h=520&fit=crop&auto=format"
                  alt="Konsultan keuangan Solusi Dana Sahabat"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.82 }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,22,64,0.55) 0%, transparent 55%)' }} />
              </div>

              {/* Floating info cards */}
              <div
                className="absolute -left-8 top-12 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl"
                style={{ background: 'white', minWidth: 192, border: '1px solid #e8edf5' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#eff6ff' }}>🏍️</div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Jaminan BPKB Motor</div>
                  <div className="text-sm font-bold" style={{ color: '#0c2461' }}>Mulai Rp 1 Juta</div>
                </div>
              </div>
              <div
                className="absolute -right-6 bottom-20 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl"
                style={{ background: 'white', minWidth: 204, border: '1px solid #e8edf5' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#fff7ed' }}>🚙</div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Jaminan BPKB Mobil</div>
                  <div className="text-sm font-bold" style={{ color: '#0c2461' }}>Dana Lebih Besar</div>
                </div>
              </div>
              <div
                className="absolute left-8 bottom-6 px-4 py-2.5 rounded-full flex items-center gap-2 shadow-xl"
                style={{ background: 'rgba(7,22,64,0.92)', border: '1px solid rgba(232,160,32,0.35)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fbbf24" strokeWidth="1.8"><path d="M7 1l1.55 2.5L12 4.2l-2.5 2.3.59 3.3L7 8.2 3.91 9.8l.59-3.3L2 4.2l3.45-.7L7 1z"/></svg>
                <span className="text-sm text-white font-medium">Data Aman & Terjaga</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {stats.map((s) => (
              <div key={s.label} className="px-6 py-5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: '#fbbf24', fontFamily: 'DM Serif Display, serif' }}
                >
                  {s.value}
                </div>
                <div className="text-sm text-blue-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LAYANAN RINGKAS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-widest uppercase"
              style={{ background: 'rgba(12,36,97,0.07)', color: 'var(--navy-deep)', border: '1px solid rgba(12,36,97,0.1)' }}
            >
              Produk Kami
            </span>
            <h2
              className="text-3xl lg:text-4xl font-normal mb-3"
              style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}
            >
              Layanan Fasilitas Dana BPKB
            </h2>
            <p className="text-gray-500 text-sm">Dua produk fasilitas pinjaman dana jaminan BPKB untuk seluruh Indonesia.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {services.map((s) => (
              <div
                key={s.title}
                className="rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5"
                style={{ border: '1px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div className="h-44 relative overflow-hidden" style={{ background: '#1e3a8a' }}>
                  <img
                    src={s.img}
                    alt={s.title}
                    className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,36,97,0.8) 0%, transparent 60%)' }} />
                  <div
                    className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm font-bold text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#e8a020)' }}
                  >
                    {s.icon} {s.label}
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--navy-deep)' }}>{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.desc}</p>
                  <div className="flex items-center justify-between">
                    <Link
                      to="/simulasi"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                      style={{ background: 'var(--navy-deep)', boxShadow: '0 2px 10px rgba(12,36,97,0.2)' }}
                    >
                      Ajukan Sekarang →
                    </Link>
                    <Link to="/layanan" className="text-xs font-medium hover:underline" style={{ color: 'var(--navy-deep)', opacity: 0.6 }}>
                      Info lengkap
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/layanan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-md"
              style={{ border: '2px solid var(--navy-deep)', color: 'var(--navy-deep)' }}
            >
              Lihat Semua Layanan →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CARA PENGAJUAN RINGKAS ── */}
      <section className="py-20" style={{ background: '#f8faff' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-widest uppercase"
              style={{ background: 'rgba(12,36,97,0.07)', color: 'var(--navy-deep)', border: '1px solid rgba(12,36,97,0.1)' }}
            >
              Cara Pengajuan
            </span>
            <h2
              className="text-3xl font-normal mb-3"
              style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}
            >
              5 Langkah Mudah Pengajuan Dana BPKB
            </h2>
            <p className="text-gray-500 text-sm">Dipandu penuh oleh tim agen kami dari awal hingga dana cair.</p>
          </div>

          {/* Steps row */}
          <div className="relative">
            <div className="hidden sm:block absolute top-7 left-[10%] right-[10%] h-0.5" style={{ background: 'linear-gradient(90deg, #0c2461, #e8a020, #16a34a)', opacity: 0.2 }} />
            <div className="grid sm:grid-cols-5 gap-6">
              {steps.map((step, i) => (
                <div key={step.num} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center mb-3 shadow-lg"
                    style={{
                      background: i === 4 ? 'linear-gradient(135deg,#f59e0b,#e8a020)' : 'var(--navy-deep)',
                      color: 'white',
                      boxShadow: i === 4 ? '0 6px 20px rgba(232,160,32,0.35)' : '0 6px 20px rgba(12,36,97,0.25)',
                    }}
                  >
                    <span className="text-lg leading-none">{step.icon}</span>
                    <span className="text-[9px] font-bold opacity-60 mt-0.5">{step.num}</span>
                  </div>
                  <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--navy-deep)' }}>{step.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/cara-pengajuan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: 'var(--navy-deep)', boxShadow: '0 4px 16px rgba(12,36,97,0.25)' }}
            >
              Lihat Detail Cara Pengajuan →
            </Link>
          </div>
        </div>
      </section>

      {/* ── BLOG TEASER ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-widest uppercase"
                style={{ background: 'rgba(12,36,97,0.07)', color: 'var(--navy-deep)', border: '1px solid rgba(12,36,97,0.1)' }}
              >
                Blog & Artikel
              </span>
              <h2
                className="text-3xl lg:text-4xl font-normal"
                style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}
              >
                Panduan Pinjaman Dana BPKB
              </h2>
              <p className="text-gray-500 text-sm mt-2">Tips, panduan, dan informasi seputar fasilitas dana jaminan BPKB.</p>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all hover:shadow-md flex-shrink-0"
              style={{ border: '2px solid var(--navy-deep)', color: 'var(--navy-deep)' }}
            >
              Lihat Semua Artikel →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredPosts.map((post, i) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                style={{ border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden" style={{ background: '#1e3a8a' }}>
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: i === 0 ? 'linear-gradient(135deg,#0c2461,#1d4ed8)' : i === 1 ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'linear-gradient(135deg,#0c2461,#7c3aed)' }} />
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />

                  {/* Category badge */}
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ background: categoryColor[post.category] || '#0c2461' }}
                  >
                    {post.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 bg-white flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime} baca</span>
                  </div>
                  <h3
                    className="text-sm font-semibold mb-2 leading-snug group-hover:underline"
                    style={{ color: 'var(--navy-deep)' }}
                  >
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed flex-1 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div
                    className="mt-4 pt-4 text-xs font-semibold flex items-center gap-1.5 transition-gap"
                    style={{ color: 'var(--navy-deep)', borderTop: '1px solid #f1f5f9' }}
                  >
                    Baca Selengkapnya
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6h8M6 2l4 4-4 4"/></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #030d1e 0%, #071640 40%, #0c2461 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(232,160,32,0.06) 0%, transparent 65%)', transform: 'translate(-50%, -50%)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2
            className="font-normal text-white mb-4"
            style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)' }}
          >
            Siap Mengajukan Dana atau Menjadi Agen?
          </h2>
          <p className="text-blue-200 mb-8 max-w-lg mx-auto">
            Tim Solusi Dana Sahabat siap membantu proses pengajuan dana BPKB motor dan mobil di seluruh Indonesia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/simulasi"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#e8a020)', boxShadow: '0 4px 20px rgba(232,160,32,0.4)' }}
            >
              💳 Ajukan Pinjaman Dana
            </Link>
            <Link
              to="/career"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white border border-white/25 hover:bg-white/10 transition-all"
            >
              👔 Daftar Jadi Agen
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
