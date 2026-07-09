import { Link } from 'react-router'

const steps = [
  {
    num: '01',
    title: 'Isi Form Pengajuan',
    desc: 'Lengkapi form online dengan data diri, informasi kendaraan, dan jumlah dana yang dibutuhkan.',
    color: '#0c2461',
  },
  {
    num: '02',
    title: 'Tim Menghubungi Anda',
    desc: 'Agen kami segera menghubungi untuk konfirmasi data dan memberikan informasi kelengkapan berkas.',
    color: '#1d4ed8',
  },
  {
    num: '03',
    title: 'Pengecekan Dokumen',
    desc: 'Persiapkan dokumen yang dibutuhkan. Tim kami memastikan kelengkapan berkas sebelum diajukan.',
    color: '#2563eb',
  },
  {
    num: '04',
    title: 'Survey & Proses Leasing',
    desc: 'Pihak leasing melakukan survey terhadap kondisi kendaraan dan analisis kelayakan pengajuan.',
    color: '#e8a020',
  },
  {
    num: '05',
    title: 'Dana Cair Jika Disetujui',
    desc: 'Jika disetujui oleh leasing, dana dicairkan sesuai ketentuan yang berlaku antara nasabah dan leasing.',
    color: '#16a34a',
  },
]

const docs = [
  'KTP (Kartu Tanda Penduduk)',
  'Kartu Keluarga (KK)',
  'BPKB Kendaraan Asli',
  'STNK Kendaraan',
  'Slip Gaji / Bukti Penghasilan',
  'Foto Kendaraan (tampak depan & samping)',
]

export default function HowToApply() {
  return (
    <section
      id="cara-pengajuan"
      className="py-20 lg:py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f8faff 0%, #eff6ff 100%)' }}
    >
      {/* Decorative element */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(12,36,97,0.04) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
            style={{ background: 'rgba(12,36,97,0.07)', color: 'var(--navy-deep)', border: '1px solid rgba(12,36,97,0.1)' }}
          >
            Cara Pengajuan
          </span>
          <h2
            className="text-3xl lg:text-4xl font-normal mb-4 leading-tight"
            style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}
          >
            Cara Mengajukan Pinjaman Dana BPKB
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Proses pengajuan dirancang mudah dan transparan, didampingi penuh oleh tim agen profesional Solusi Dana Sahabat.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 items-start">

          {/* Steps — span 2 col */}
          <div className="lg:col-span-2">
            <div className="relative">
              {/* Connector line */}
              <div
                className="absolute left-7 top-7 hidden md:block"
                style={{
                  width: 2,
                  bottom: '2rem',
                  background: 'linear-gradient(to bottom, #0c2461 0%, #e8a020 70%, #16a34a 100%)',
                  opacity: 0.2,
                }}
              />

              <div className="space-y-5">
                {steps.map((step, i) => (
                  <div key={step.num} className="flex gap-5 items-start group">
                    {/* Step circle */}
                    <div
                      className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 relative z-10 transition-all duration-300 group-hover:scale-105"
                      style={{
                        background: step.color,
                        boxShadow: `0 8px 24px ${step.color}33`,
                      }}
                    >
                      <span className="text-xs font-bold text-white opacity-60 leading-none">{step.num}</span>
                      <span className="text-lg leading-none mt-0.5">
                        {i === 0 && '📝'}
                        {i === 1 && '📞'}
                        {i === 2 && '📋'}
                        {i === 3 && '🔍'}
                        {i === 4 && '✅'}
                      </span>
                    </div>

                    {/* Content card */}
                    <div
                      className="flex-1 p-5 rounded-2xl hover:shadow-md transition-all duration-300"
                      style={{
                        background: 'white',
                        border: '1px solid #e8edf5',
                        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--navy-deep)' }}>
                          {step.title}
                        </h3>
                        {i === 4 && (
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
                            style={{ background: '#16a34a' }}
                          >
                            Final
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div
              className="mt-8 px-6 py-4 rounded-2xl text-sm flex gap-3 items-start"
              style={{ background: 'rgba(232,160,32,0.07)', border: '1px solid rgba(232,160,32,0.2)', color: '#92400e' }}
            >
              <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#e8a020" strokeWidth="1.8">
                <circle cx="9" cy="9" r="8"/><path d="M9 5v4M9 13h.01" strokeLinecap="round"/>
              </svg>
              <span>
                <strong>Catatan:</strong> Persetujuan pengajuan mengikuti ketentuan dan hasil analisis dari pihak leasing terkait. Solusi Dana Sahabat berperan sebagai fasilitator proses.
              </span>
            </div>
          </div>

          {/* Sidebar: dokumen */}
          <div className="lg:col-span-1">
            <div
              className="rounded-3xl p-7 sticky top-6"
              style={{ background: 'linear-gradient(145deg, #071640, #0c2461)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <h3
                className="text-lg font-semibold text-white mb-1"
                style={{ fontFamily: 'DM Serif Display, serif' }}
              >
                Dokumen yang Diperlukan
              </h3>
              <p className="text-blue-200 text-xs mb-6">Siapkan dokumen berikut sebelum mengajukan:</p>

              <ul className="space-y-3">
                {docs.map((d) => (
                  <li key={d} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(232,160,32,0.15)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l2.5 2.5 5.5-5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-blue-100">{d}</span>
                  </li>
                ))}
              </ul>

              <div
                className="mt-7 pt-5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-xs text-blue-200 mb-4">Tim kami akan memandu kelengkapan dokumen Anda.</p>
                <Link
                  to="/simulasi"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #e8a020)', boxShadow: '0 4px 20px rgba(232,160,32,0.3)' }}
                >
                  Mulai Pengajuan
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 7h10M7 2l5 5-5 5"/></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
