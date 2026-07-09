import { Link } from 'react-router'

const advantages = [
  { icon: '📝', title: 'Proses Pengajuan Mudah', desc: 'Isi form online, tim agen kami segera menghubungi dan memandu Anda melalui setiap langkah pengajuan pinjaman dana BPKB.' },
  { icon: '🌍', title: 'Tersedia di Seluruh Indonesia', desc: 'Layanan fasilitas dana BPKB kami menjangkau seluruh wilayah Indonesia melalui jaringan agen dan mitra leasing.' },
  { icon: '🏦', title: 'Banyak Mitra Leasing', desc: 'Bekerja sama dengan berbagai leasing terpercaya sehingga pilihan dan peluang persetujuan pengajuan lebih luas.' },
  { icon: '🤝', title: 'Dibantu Sampai Proses Survey', desc: 'Tim agen profesional mendampingi dari awal pengajuan hingga proses survey dan serah terima dokumen BPKB.' },
  { icon: '🚗', title: 'Cocok untuk Motor dan Mobil', desc: 'Menerima pengajuan dengan jaminan BPKB motor maupun mobil dari berbagai merek dan tahun kendaraan.' },
  { icon: '👔', title: 'Tim Agen Profesional', desc: 'Agen kami terlatih, berpengalaman, dan siap memberikan layanan konsultasi terbaik untuk setiap nasabah.' },
  { icon: '🔒', title: 'Data Nasabah Aman', desc: 'Kami menjaga kerahasiaan data nasabah dengan standar keamanan informasi yang ketat dan bertanggung jawab.' },
  { icon: '💬', title: 'Konsultasi Gratis', desc: 'Tidak ada biaya konsultasi. Hubungi tim agen kami kapan saja untuk bertanya tentang pengajuan fasilitas dana BPKB.' },
  { icon: '📊', title: 'Transparan & Jujur', desc: 'Kami berkomitmen memberikan informasi yang transparan mengenai proses, biaya, dan ketentuan pengajuan dana.' },
]

export default function Keunggulan() {
  return (
    <>
      <div className="pt-24 pb-14" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase" style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}>Keunggulan Kami</span>
          <h1 className="text-4xl lg:text-5xl font-normal text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Mengapa Memilih Solusi Dana Sahabat?
          </h1>
          <p className="text-blue-200 leading-relaxed">Kami hadir sebagai mitra terpercaya untuk membantu proses fasilitas dana BPKB motor dan mobil dengan layanan profesional.</p>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((a) => (
              <div key={a.title} className="p-6 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{ background: '#f8faff', border: '1px solid var(--border)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ background: 'rgba(12,36,97,0.08)' }}>{a.icon}</div>
                <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--navy-deep)' }}>{a.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-16" style={{ background: 'var(--navy-deep)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[{ val: '34+', label: 'Provinsi Terlayani' }, { val: '10+', label: 'Mitra Leasing' }, { val: '5.000+', label: 'Pengajuan Diproses' }, { val: '500+', label: 'Agen Aktif' }].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--gold-light)', fontFamily: 'DM Serif Display, serif' }}>{s.val}</div>
                <div className="text-sm text-blue-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white text-center">
        <Link to="/simulasi" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all hover:scale-105" style={{ background: 'var(--gold)' }}>
          💳 Ajukan Pinjaman Dana Sekarang
        </Link>
      </section>
    </>
  )
}
