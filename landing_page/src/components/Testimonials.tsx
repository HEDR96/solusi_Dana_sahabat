const testimonials = [
  {
    name: 'Budi Santoso',
    role: 'Pemilik UMKM Kuliner, Jakarta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
    text: 'Proses pengajuan pinjaman dana BPKB motor saya dibantu penuh dari awal sampai akhir. Tim agennya sangat responsif dan profesional. Dana cair sesuai kebutuhan modal usaha saya.',
    rating: 5,
    badge: 'Nasabah BPKB Motor',
  },
  {
    name: 'Dewi Rahmawati',
    role: 'Ibu Rumah Tangga, Surabaya',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&auto=format',
    text: 'Saya butuh dana mendesak untuk biaya pendidikan anak. Alhamdulillah dengan jaminan BPKB mobil, prosesnya tidak berbelit. Tim Solusi Dana Sahabat sangat membantu dan transparan.',
    rating: 5,
    badge: 'Nasabah BPKB Mobil',
  },
  {
    name: 'Rizki Firmansyah',
    role: 'Agen Mitra, Bandung',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format',
    text: 'Bergabung sebagai agen sudah 6 bulan. Komisi menarik dan sistem supportnya bagus. Bisa kerja fleksibel dari mana saja. Produknya juga banyak dibutuhkan masyarakat, jadi mudah dicari nasabahnya.',
    rating: 5,
    badge: 'Agen Mitra',
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < count ? 'text-yellow-400' : 'text-gray-200'} style={{ fontSize: 14 }}>★</span>
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section
      id="testimoni"
      className="py-20 lg:py-28"
      style={{ background: 'linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase"
            style={{ background: 'rgba(12,36,97,0.08)', color: 'var(--navy-deep)' }}
          >
            Testimoni
          </span>
          <h2 className="text-3xl lg:text-4xl font-normal mb-4" style={{ color: 'var(--navy-deep)' }}>
            Dipercaya oleh Nasabah dan Agen
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Ribuan nasabah dan agen telah mempercayakan kebutuhan fasilitas dana BPKB mereka kepada Solusi Dana Sahabat.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-7">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-6 rounded-2xl flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{ background: 'white', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between">
                <Stars count={t.rating} />
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(12,36,97,0.08)', color: 'var(--navy-deep)' }}
                >
                  {t.badge}
                </span>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed flex-1">"{t.text}"</p>

              <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ background: '#e0e7ff' }}
                />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--navy-deep)' }}>{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div
          className="mt-14 rounded-2xl px-8 py-6 flex flex-wrap justify-around gap-6 text-center"
          style={{ background: 'var(--navy-deep)' }}
        >
          {[
            { val: '5.000+', label: 'Pengajuan Diproses' },
            { val: '4.8 / 5', label: 'Rating Kepuasan' },
            { val: '34+', label: 'Provinsi Terlayani' },
            { val: '500+', label: 'Agen Aktif' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--gold-light)', fontFamily: 'DM Serif Display, serif' }}>{s.val}</div>
              <div className="text-sm text-blue-200">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
