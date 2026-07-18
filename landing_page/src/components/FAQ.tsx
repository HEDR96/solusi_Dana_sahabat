import { useState } from 'react'

const faqs = [
  {
    q: 'Apakah BPKB motor bisa diajukan?',
    a: 'Ya, BPKB motor dapat diajukan sesuai tahun kendaraan, kondisi unit, dan kebijakan leasing yang berlaku. Tim agen kami akan membantu mengecek kelayakan kendaraan Anda.',
  },
  {
    q: 'Apakah BPKB mobil bisa diajukan?',
    a: 'Ya, BPKB mobil bisa diajukan untuk kebutuhan dana yang lebih besar. Proses pengajuan jaminan BPKB mobil akan dibantu penuh oleh tim agen kami hingga ke tahap survey.',
  },
  {
    q: 'Apakah layanan fasilitas dana BPKB tersedia seluruh Indonesia?',
    a: 'Ya, layanan kami tersedia di berbagai wilayah Indonesia melalui jaringan mitra agen dan leasing yang tersebar dari Sabang sampai Merauke.',
  },
  {
    q: 'Apakah pengajuan pasti disetujui?',
    a: 'Persetujuan mengikuti hasil pengecekan data, kondisi kendaraan, dan kebijakan leasing terkait. Tim kami akan membantu memaksimalkan peluang persetujuan pengajuan Anda.',
  },
  {
    q: 'Dokumen apa saja yang dibutuhkan untuk pengajuan?',
    a: 'Umumnya dibutuhkan: KTP, BPKB asli, STNK, dan dokumen pendukung lainnya. Tim agen kami akan menginformasikan secara lengkap sesuai ketentuan leasing yang dipilih.',
  },
  {
    q: 'Bagaimana cara menjadi agen Solusi Dana Sahabat?',
    a: 'Calon agen dapat mengisi formulir Career Agen di halaman ini, dan tim kami akan menghubungi untuk proses selanjutnya. Tidak ada biaya pendaftaran untuk bergabung menjadi agen.',
  },
  {
    q: 'Berapa lama proses pengajuan dana BPKB?',
    a: 'Durasi proses tergantung kelengkapan dokumen dan proses survey dari leasing. Tim agen kami akan memandu agar proses berjalan secepat mungkin sesuai ketentuan leasing.',
  },
  {
    q: 'Leasing apa saja yang bekerja sama dengan Solusi Dana Sahabat?',
    a: 'Kami bekerja sama dengan berbagai leasing terpercaya yang beroperasi secara nasional. Tim agen akan merekomendasikan leasing yang paling sesuai dengan profil dan kebutuhan Anda.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-16">
          {/* Left */}
          <div className="lg:col-span-2">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase"
              style={{ background: 'rgba(12,36,97,0.08)', color: 'var(--navy-deep)' }}
            >
              FAQ
            </span>
            <h2 className="text-3xl lg:text-4xl font-normal mb-5" style={{ color: 'var(--navy-deep)' }}>
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Tidak menemukan jawaban yang Anda cari? Hubungi tim kami langsung melalui WhatsApp.
            </p>
            <a
              href="https://wa.me/6281265593904"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: '#22c55e' }}
            >
              <span>💬</span> Chat via WhatsApp
            </a>
          </div>

          {/* Right — accordion */}
          <div className="lg:col-span-3 space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden transition-all"
                style={{ border: `1px solid ${open === i ? 'var(--navy-deep)' : 'var(--border)'}` }}
              >
                <button
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 transition-colors"
                  style={{ background: open === i ? 'rgba(12,36,97,0.04)' : 'white' }}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="text-sm font-semibold leading-snug" style={{ color: 'var(--navy-deep)' }}>
                    {faq.q}
                  </span>
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-transform"
                    style={{
                      background: open === i ? 'var(--navy-deep)' : 'var(--muted)',
                      color: open === i ? 'white' : 'var(--navy-deep)',
                      transform: open === i ? 'rotate(180deg)' : 'none',
                    }}
                  >
                    ↓
                  </span>
                </button>
                {open === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
