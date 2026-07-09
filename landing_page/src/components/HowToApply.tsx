const steps = [
  {
    num: '01',
    icon: '📝',
    title: 'Isi Form Pengajuan',
    desc: 'Lengkapi form online dengan data diri, informasi kendaraan, dan kebutuhan dana Anda.',
  },
  {
    num: '02',
    icon: '📞',
    title: 'Tim Menghubungi Anda',
    desc: 'Agen kami akan segera menghubungi untuk konfirmasi data dan memberikan informasi lebih lanjut.',
  },
  {
    num: '03',
    icon: '📋',
    title: 'Pengecekan Data & Dokumen',
    desc: 'Persiapkan dokumen yang dibutuhkan. Tim kami membantu memastikan kelengkapan berkas pengajuan.',
  },
  {
    num: '04',
    icon: '🔍',
    title: 'Survey dan Proses Leasing',
    desc: 'Pihak leasing melakukan survey terhadap kondisi kendaraan dan melakukan analisis kelayakan.',
  },
  {
    num: '05',
    icon: '✅',
    title: 'Dana Cair Jika Disetujui',
    desc: 'Jika pengajuan disetujui oleh leasing, dana akan dicairkan sesuai dengan ketentuan yang berlaku.',
  },
]

export default function HowToApply() {
  return (
    <section
      id="cara-pengajuan"
      className="py-20 lg:py-28"
      style={{ background: 'linear-gradient(180deg, #f8faff 0%, #eff6ff 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase"
            style={{ background: 'rgba(12,36,97,0.08)', color: 'var(--navy-deep)' }}
          >
            Cara Pengajuan
          </span>
          <h2 className="text-3xl lg:text-4xl font-normal mb-4" style={{ color: 'var(--navy-deep)' }}>
            Cara Mengajukan Pinjaman Dana BPKB
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Proses pengajuan pinjaman dana dengan jaminan BPKB motor dan mobil dirancang mudah dan transparan, didampingi oleh tim agen kami.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connector line */}
          <div
            className="absolute left-8 top-12 bottom-12 w-0.5 hidden md:block"
            style={{ background: 'linear-gradient(to bottom, var(--navy-deep), var(--gold))' }}
          />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={step.num} className="flex gap-6 md:gap-8 items-start">
                {/* Circle number */}
                <div
                  className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 relative z-10 shadow-lg"
                  style={{
                    background: i === 4 ? 'var(--gold)' : 'var(--navy-deep)',
                    color: 'white',
                  }}
                >
                  <div className="text-lg">{step.icon}</div>
                  <div className="text-xs font-bold opacity-70">{step.num}</div>
                </div>

                {/* Content */}
                <div
                  className="flex-1 p-5 rounded-2xl mb-0 hover:shadow-md transition-all"
                  style={{ background: 'white', border: '1px solid var(--border)' }}
                >
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--navy-deep)' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="mt-10 max-w-2xl mx-auto text-center px-6 py-4 rounded-xl text-sm"
          style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.25)', color: '#92400e' }}
        >
          <span className="font-medium">Catatan:</span> Persetujuan pengajuan mengikuti ketentuan dan hasil analisis dari pihak leasing terkait.
        </div>

        <div className="text-center mt-8">
          <a
            href="#simulasi"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-xl"
            style={{ background: 'var(--navy-deep)' }}
          >
            Mulai Pengajuan Sekarang →
          </a>
        </div>
      </div>
    </section>
  )
}
