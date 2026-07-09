import { Link } from 'react-router'

const badges = [
  { icon: '🌐', text: 'Tersedia Seluruh Indonesia' },
  { icon: '🏦', text: 'Banyak Pilihan Leasing' },
  { icon: '⚡', text: 'Proses Cepat & Aman' },
  { icon: '🚗', text: 'Motor & Mobil Bisa Diajukan' },
]

const services = [
  {
    icon: '🏍️',
    title: 'Pinjaman BPKB Motor',
    desc: 'Fasilitas dana dengan jaminan BPKB motor untuk modal usaha, pendidikan, renovasi, dan kebutuhan lainnya.',
    to: '/layanan',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=280&fit=crop&auto=format',
  },
  {
    icon: '🚙',
    title: 'Pinjaman BPKB Mobil',
    desc: 'Dana lebih besar dengan jaminan BPKB mobil, dibantu tim profesional hingga proses survey leasing.',
    to: '/layanan',
    img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&h=280&fit=crop&auto=format',
  },
]

const steps = [
  { num: '01', icon: '📝', title: 'Isi Form Pengajuan' },
  { num: '02', icon: '📞', title: 'Tim Menghubungi Anda' },
  { num: '03', icon: '📋', title: 'Cek Data & Dokumen' },
  { num: '04', icon: '🔍', title: 'Survey & Proses Leasing' },
  { num: '05', icon: '✅', title: 'Dana Cair Jika Disetujui' },
]

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #071640 0%, #0c2461 45%, #1e3a8a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #e8a020 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--gold-light)', border: '1px solid rgba(232,160,32,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Layanan Fasilitas Dana Terpercaya
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-white leading-tight mb-6" style={{ fontFamily: 'DM Serif Display, serif' }}>
                Solusi Pinjaman Dana dengan Jaminan{' '}
                <span style={{ color: 'var(--gold-light)' }}>BPKB Motor & Mobil</span>
              </h1>

              <p className="text-blue-200 text-lg leading-relaxed mb-8 max-w-xl">
                Solusi Dana Sahabat membantu Anda mendapatkan fasilitas dana dengan proses mudah, cepat, dan tersedia di seluruh Indonesia melalui berbagai mitra leasing terpercaya.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/simulasi" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-105" style={{ background: 'var(--gold)', boxShadow: '0 4px 20px rgba(232,160,32,0.4)' }}>
                  Ajukan Pinjaman Sekarang →
                </Link>
                <Link to="/career" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white border border-white/30 hover:bg-white/10 transition-all">
                  Gabung Jadi Agen
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {badges.map((b) => (
                  <div key={b.text} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-lg">{b.icon}</span>
                    <span className="text-sm text-blue-100 font-medium">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-2xl overflow-hidden" style={{ height: 460, background: '#1e3a8a' }}>
                <img src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=700&h=500&fit=crop&auto=format" alt="Konsultan keuangan Solusi Dana Sahabat membantu pengajuan pinjaman BPKB" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,36,97,0.6) 0%, transparent 60%)' }} />
              </div>
              <div className="absolute -left-6 top-12 px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl" style={{ background: 'white', minWidth: 180 }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: '#eff6ff' }}>🏍️</div>
                <div>
                  <div className="text-xs text-gray-500">Jaminan BPKB Motor</div>
                  <div className="text-sm font-bold text-gray-800">Mulai Rp 1 Juta</div>
                </div>
              </div>
              <div className="absolute -right-4 bottom-20 px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl" style={{ background: 'white', minWidth: 190 }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: '#fff7ed' }}>🚙</div>
                <div>
                  <div className="text-xs text-gray-500">Jaminan BPKB Mobil</div>
                  <div className="text-sm font-bold text-gray-800">Dana Lebih Besar</div>
                </div>
              </div>
              <div className="absolute left-8 bottom-6 px-4 py-2.5 rounded-full flex items-center gap-2 shadow-xl" style={{ background: 'rgba(12,36,97,0.9)', border: '1px solid rgba(232,160,32,0.4)' }}>
                <span className="text-yellow-400">🔒</span>
                <span className="text-sm text-white font-medium">Data Aman & Terjaga</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[{ value: '34+', label: 'Provinsi Terlayani' }, { value: '10+', label: 'Mitra Leasing' }, { value: '5.000+', label: 'Pengajuan Diproses' }, { value: '24 Jam', label: 'Respons Tim Agen' }].map((s) => (
              <div key={s.label} className="px-6 py-5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--gold-light)', fontFamily: 'DM Serif Display, serif' }}>{s.value}</div>
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
            <h2 className="text-3xl lg:text-4xl font-normal mb-4" style={{ color: 'var(--navy-deep)' }}>Layanan Fasilitas Dana BPKB</h2>
            <p className="text-gray-500">Dua jenis produk fasilitas pinjaman dana jaminan BPKB yang tersedia untuk seluruh Indonesia.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1" style={{ border: '1px solid var(--border)' }}>
                <div className="h-44 relative overflow-hidden" style={{ background: '#1e3a8a' }}>
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,36,97,0.8) 0%, transparent 60%)' }} />
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold text-white" style={{ background: 'var(--gold)' }}>
                    {s.icon} {s.title}
                  </div>
                </div>
                <div className="p-5 bg-white">
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.desc}</p>
                  <Link to={s.to} className="inline-flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all" style={{ color: 'var(--navy-deep)' }}>
                    Selengkapnya →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/layanan" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all hover:shadow-md" style={{ border: '2px solid var(--navy-deep)', color: 'var(--navy-deep)' }}>
              Lihat Semua Layanan →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CARA PENGAJUAN RINGKAS ── */}
      <section className="py-20" style={{ background: '#f8faff' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-normal mb-3" style={{ color: 'var(--navy-deep)' }}>Cara Mengajukan Pinjaman Dana BPKB</h2>
            <p className="text-gray-500">Lima langkah mudah untuk mendapatkan fasilitas dana yang Anda butuhkan.</p>
          </div>
          <div className="grid sm:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center mb-3 shadow-md" style={{ background: i === 4 ? 'var(--gold)' : 'var(--navy-deep)', color: 'white' }}>
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-xs font-bold opacity-70">{step.num}</span>
                </div>
                <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--navy-deep)' }}>{step.title}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/cara-pengajuan" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: 'var(--navy-deep)' }}>
              Lihat Detail Cara Pengajuan →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #071640 0%, #0c2461 60%, #1e3a8a 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Siap Mengajukan Dana atau Menjadi Agen?
          </h2>
          <p className="text-blue-200 mb-8">Tim Solusi Dana Sahabat siap membantu proses pengajuan dana BPKB motor dan mobil di seluruh Indonesia.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/simulasi" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-105" style={{ background: 'var(--gold)', boxShadow: '0 4px 20px rgba(232,160,32,0.4)' }}>
              💳 Ajukan Pinjaman Dana
            </Link>
            <Link to="/career" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white border border-white/30 hover:bg-white/10 transition-all">
              👔 Daftar Jadi Agen
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
