import { Link } from 'react-router'

const stats = [
  { value: '34+', label: 'Provinsi Terlayani' },
  { value: '10+', label: 'Mitra Leasing' },
  { value: '5.000+', label: 'Pengajuan Diproses' },
  { value: '24 Jam', label: 'Respons Agen' },
]

const badges = [
  { icon: '🌐', text: 'Seluruh Indonesia' },
  { icon: '🏦', text: 'Banyak Pilihan Leasing' },
  { icon: '⚡', text: 'Proses Cepat & Aman' },
  { icon: '🚗', text: 'Motor & Mobil' },
]

export default function Hero() {
  return (
    <section
      id="beranda"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #030d1e 0%, #071640 40%, #0c2461 75%, #1a3a8a 100%)' }}
    >
      {/* Background elements */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 70% 20%, rgba(232,160,32,0.07) 0%, transparent 50%), radial-gradient(circle at 15% 80%, rgba(59,130,246,0.08) 0%, transparent 45%)',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(232,160,32,0.08) 0%, transparent 65%)',
          transform: 'translate(20%, -20%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left — Copy */}
          <div>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-7"
              style={{
                background: 'rgba(232,160,32,0.12)',
                color: '#fbbf24',
                border: '1px solid rgba(232,160,32,0.25)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Layanan Fasilitas Dana Terpercaya #1
            </div>

            <h1
              className="font-normal text-white leading-[1.1] mb-6"
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              }}
            >
              Solusi Pinjaman Dana{' '}
              <br className="hidden sm:block" />
              Jaminan{' '}
              <span
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '0px',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  backgroundImage: 'linear-gradient(135deg, #fbbf24, #e8a020)',
                }}
              >
                BPKB Motor & Mobil
              </span>
            </h1>

            <p className="text-base leading-relaxed mb-8 max-w-lg" style={{ color: 'rgba(148,163,184,0.9)' }}>
              Solusi Dana Sahabat membantu Anda mendapatkan fasilitas dana dengan proses mudah,
              cepat, dan aman — tersedia di seluruh Indonesia melalui berbagai mitra leasing terpercaya.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/simulasi"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #e8a020)', boxShadow: '0 4px 20px rgba(232,160,32,0.4)' }}
              >
                Ajukan Pinjaman Sekarang
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link
                to="/career"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Gabung Jadi Agen
              </Link>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2.5">
              {badges.map((b) => (
                <div
                  key={b.text}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-base">{b.icon}</span>
                  <span className="text-xs font-medium" style={{ color: '#93c5fd' }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Visual card */}
          <div className="relative hidden lg:block">
            {/* Main image card */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                height: 480,
                background: 'linear-gradient(135deg, #0c2461, #1e3a8a)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=700&h=500&fit=crop&auto=format"
                alt="Konsultan keuangan Solusi Dana Sahabat membantu pengajuan pinjaman BPKB"
                className="w-full h-full object-cover"
                style={{ opacity: 0.7, mixBlendMode: 'luminosity' }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(7,22,64,0.85) 0%, rgba(12,36,97,0.3) 50%, transparent 80%)' }}
              />

              {/* Bottom overlay text */}
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white/60 text-xs mb-1">Layanan Terpercaya</p>
                <p className="text-white font-semibold text-lg" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Solusi Dana Sahabat
                </p>
              </div>
            </div>

            {/* Floating card — Motor */}
            <div
              className="absolute -left-8 top-12 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl"
              style={{ background: 'white', minWidth: 190, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#eff6ff' }}
              >
                🏍️
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">BPKB Motor</div>
                <div className="text-sm font-bold" style={{ color: '#0c2461' }}>Mulai Rp 1 Juta</div>
              </div>
            </div>

            {/* Floating card — Mobil */}
            <div
              className="absolute -right-6 bottom-20 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl"
              style={{ background: 'white', minWidth: 200, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#fff7ed' }}
              >
                🚙
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">BPKB Mobil</div>
                <div className="text-sm font-bold" style={{ color: '#0c2461' }}>Dana Lebih Besar</div>
              </div>
            </div>

            {/* Trust pill */}
            <div
              className="absolute left-8 bottom-5 px-4 py-2 rounded-full flex items-center gap-2"
              style={{
                background: 'rgba(7,22,64,0.95)',
                border: '1px solid rgba(232,160,32,0.35)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <span className="text-yellow-400 text-sm">🔒</span>
              <span className="text-sm text-white font-medium">Data Aman & Terjaga</span>
            </div>

            {/* Decorative ring */}
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
              style={{ border: '2px solid rgba(232,160,32,0.2)' }}
            />
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
              style={{ border: '1px solid rgba(232,160,32,0.08)' }}
            />
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="mt-16 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="px-6 py-5 text-center"
                style={{
                  borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: '#fbbf24', fontFamily: 'DM Serif Display, serif' }}
                >
                  {s.value}
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
