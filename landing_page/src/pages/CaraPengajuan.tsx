import { Link } from 'react-router'

const steps = [
  { num: '01', icon: '📝', title: 'Isi Form Pengajuan', desc: 'Lengkapi form online dengan data diri, informasi kendaraan jaminan BPKB motor atau mobil, dan kebutuhan dana Anda. Prosesnya cepat dan mudah.' },
  { num: '02', icon: '📞', title: 'Tim Menghubungi Anda', desc: 'Agen Solusi Dana Sahabat akan segera menghubungi untuk konfirmasi data dan memberikan informasi serta arahan lebih lanjut mengenai pengajuan.' },
  { num: '03', icon: '📋', title: 'Pengecekan Data & Dokumen', desc: 'Persiapkan dokumen yang dibutuhkan. Tim agen kami membantu memastikan kelengkapan berkas untuk pengajuan ke pihak leasing.' },
  { num: '04', icon: '🔍', title: 'Survey dan Proses Leasing', desc: 'Pihak leasing melakukan survey terhadap kondisi kendaraan jaminan BPKB dan melakukan analisis kelayakan sesuai kebijakan mereka.' },
  { num: '05', icon: '✅', title: 'Dana Cair Jika Disetujui', desc: 'Jika pengajuan fasilitas dana BPKB disetujui oleh leasing, dana akan dicairkan sesuai dengan nominal dan ketentuan yang telah disepakati.' },
]

const docs = [
  { icon: '🪪', title: 'KTP Asli', desc: 'KTP pemohon yang masih berlaku.' },
  { icon: '📄', title: 'BPKB Asli', desc: 'Buku Pemilik Kendaraan Bermotor atas nama pemohon.' },
  { icon: '📋', title: 'STNK', desc: 'Surat Tanda Nomor Kendaraan yang masih aktif.' },
  { icon: '📸', title: 'Foto Kendaraan', desc: 'Foto kendaraan dari berbagai sudut untuk keperluan survey.' },
  { icon: '📁', title: 'Dokumen Pendukung', desc: 'Dokumen tambahan sesuai ketentuan leasing terkait.' },
]

export default function CaraPengajuan() {
  return (
    <>
      <div className="pt-24 pb-14" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase" style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}>Panduan Pengajuan</span>
          <h1 className="text-4xl lg:text-5xl font-normal text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Cara Mengajukan Pinjaman Dana BPKB
          </h1>
          <p className="text-blue-200">Lima langkah mudah yang dirancang transparan dan didampingi tim agen profesional dari awal hingga selesai.</p>
        </div>
      </div>

      {/* Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute left-8 top-10 bottom-10 w-0.5 hidden md:block" style={{ background: 'linear-gradient(to bottom, var(--navy-deep), var(--gold))' }} />
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={step.num} className="flex gap-6 md:gap-10 items-start">
                  <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 relative z-10 shadow-lg" style={{ background: i === 4 ? 'var(--gold)' : 'var(--navy-deep)', color: 'white' }}>
                    <div className="text-xl">{step.icon}</div>
                    <div className="text-xs font-bold opacity-70">{step.num}</div>
                  </div>
                  <div className="flex-1 p-5 rounded-2xl hover:shadow-md transition-all" style={{ background: '#f8faff', border: '1px solid var(--border)' }}>
                    <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--navy-deep)' }}>{step.title}</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 p-5 rounded-xl text-sm text-center" style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.25)', color: '#92400e' }}>
            <strong>Catatan:</strong> Persetujuan pengajuan mengikuti ketentuan dan hasil analisis dari pihak leasing terkait.
          </div>
        </div>
      </section>

      {/* Dokumen */}
      <section className="py-16" style={{ background: '#f8faff' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-normal text-center mb-3" style={{ color: 'var(--navy-deep)' }}>Dokumen yang Dibutuhkan</h2>
          <p className="text-center text-sm text-gray-400 mb-10">Dokumen berikut umumnya dibutuhkan untuk proses pengajuan. Tim agen akan menginformasikan secara lengkap.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {docs.map((d) => (
              <div key={d.title} className="flex gap-4 p-4 rounded-xl bg-white" style={{ border: '1px solid var(--border)' }}>
                <span className="text-2xl">{d.icon}</span>
                <div>
                  <div className="font-semibold text-sm mb-1" style={{ color: 'var(--navy-deep)' }}>{d.title}</div>
                  <div className="text-xs text-gray-400">{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white text-center">
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--navy-deep)' }}>Siap Memulai Pengajuan?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/simulasi" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-105" style={{ background: 'var(--gold)' }}>
            💳 Ajukan Pinjaman Dana
          </Link>
          <Link to="/hubungi-kami" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold border transition-all hover:shadow-md" style={{ border: '2px solid var(--navy-deep)', color: 'var(--navy-deep)' }}>
            💬 Hubungi Tim Kami
          </Link>
        </div>
      </section>
    </>
  )
}
