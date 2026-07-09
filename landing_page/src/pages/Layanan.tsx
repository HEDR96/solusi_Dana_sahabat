import { Link } from 'react-router'

const products = [
  {
    icon: '🏍️',
    title: 'Pinjaman Dana Jaminan BPKB Motor',
    desc: 'Ajukan fasilitas dana dengan jaminan BPKB motor. Cocok untuk kebutuhan modal usaha, biaya pendidikan, renovasi, atau kebutuhan mendesak lainnya. Proses dibantu oleh tim profesional kami dari awal hingga pengajuan ke leasing.',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=400&fit=crop&auto=format',
    alt: 'Pinjaman dana jaminan BPKB motor seluruh Indonesia',
    checks: ['Bisa motor berbagai merek', 'Proses pengajuan mudah', 'Dibantu ke pihak leasing', 'Konsultasi gratis', 'Tersedia seluruh Indonesia', 'Tim agen berpengalaman'],
    color: '#1e3a8a',
  },
  {
    icon: '🚙',
    title: 'Pinjaman Dana Jaminan BPKB Mobil',
    desc: 'Dapatkan fasilitas dana lebih besar dengan jaminan BPKB mobil. Proses dibantu oleh tim kami hingga pengajuan ke leasing, dengan pilihan leasing yang beragam sesuai kebutuhan dan profil Anda.',
    img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=700&h=400&fit=crop&auto=format',
    alt: 'Pinjaman dana jaminan BPKB mobil seluruh Indonesia',
    checks: ['Nilai pinjaman lebih besar', 'Bebas berbagai merek mobil', 'Survey dibantu tim agen', 'Banyak pilihan leasing', 'Proses transparan', 'Sesuai kebijakan leasing'],
    color: '#0c2461',
  },
]

const leasings = ['Adira Finance', 'FIF Group', 'WOM Finance', 'Mandiri Tunas Finance', 'BCA Finance', 'ACC', 'Toyota Astra Financial', 'CIMB Niaga Auto Finance', 'Mega Finance', 'Dan lainnya']

export default function Layanan() {
  return (
    <>
      {/* Page header */}
      <div className="pt-24 pb-14" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase" style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}>Produk Kami</span>
          <h1 className="text-4xl lg:text-5xl font-normal text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Layanan Fasilitas Dana BPKB Motor & Mobil
          </h1>
          <p className="text-blue-200 leading-relaxed max-w-2xl mx-auto">
            Solusi Dana Sahabat menyediakan fasilitas pinjaman dana dengan jaminan BPKB motor dan mobil, tersedia di seluruh Indonesia melalui jaringan mitra leasing terpercaya.
          </p>
        </div>
      </div>

      {/* Products */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {products.map((p, i) => (
            <div key={p.title} className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div className="rounded-2xl overflow-hidden shadow-xl" style={{ height: 300, background: p.color }}>
                <img src={p.img} alt={p.alt} className="w-full h-full object-cover opacity-80" />
              </div>
              <div>
                <div className="text-3xl mb-3">{p.icon}</div>
                <h2 className="text-2xl lg:text-3xl font-normal mb-4" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>{p.title}</h2>
                <p className="text-gray-500 leading-relaxed mb-6 text-sm">{p.desc}</p>
                <ul className="grid grid-cols-2 gap-2 mb-6">
                  {p.checks.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0" style={{ background: 'var(--navy-deep)' }}>✓</span>
                      {c}
                    </li>
                  ))}
                </ul>
                <Link to="/simulasi" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: 'var(--gold)' }}>
                  Ajukan Sekarang →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leasing partners */}
      <section className="py-16" style={{ background: '#f8faff' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-normal text-center mb-3" style={{ color: 'var(--navy-deep)' }}>Mitra Leasing Terpercaya</h2>
          <p className="text-center text-gray-400 text-sm mb-10">Bekerja sama dengan berbagai leasing resmi untuk memaksimalkan peluang persetujuan Anda.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {leasings.map((l) => (
              <span key={l} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--navy-deep)' }}>🏦 {l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {['🔒 Data Aman', '💬 Konsultasi Gratis', '📋 Proses Sesuai Ketentuan Leasing', '🌍 Layanan Seluruh Indonesia'].map((b) => (
              <div key={b} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: '#f8faff', border: '1px solid var(--border)', color: 'var(--navy-deep)' }}>{b}</div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
