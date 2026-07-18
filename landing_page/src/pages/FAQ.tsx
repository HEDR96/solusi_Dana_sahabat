import { useState } from 'react'
import { Link } from 'react-router'

const faqs = [
  { q: 'Apakah BPKB motor bisa diajukan untuk pinjaman dana?', a: 'Ya, BPKB motor dapat diajukan sesuai tahun kendaraan, kondisi unit, dan kebijakan leasing yang berlaku. Tim agen kami akan membantu mengecek kelayakan kendaraan Anda.' },
  { q: 'Apakah BPKB mobil bisa diajukan untuk pinjaman dana?', a: 'Ya, BPKB mobil bisa diajukan untuk kebutuhan dana yang lebih besar. Proses pengajuan jaminan BPKB mobil akan dibantu penuh oleh tim agen kami.' },
  { q: 'Apakah layanan fasilitas dana BPKB tersedia seluruh Indonesia?', a: 'Ya, layanan kami tersedia di berbagai wilayah Indonesia melalui jaringan mitra agen dan leasing yang tersebar luas dari Sabang hingga Merauke.' },
  { q: 'Apakah pengajuan pinjaman dana BPKB pasti disetujui?', a: 'Persetujuan mengikuti hasil pengecekan data, kondisi kendaraan, dan kebijakan leasing terkait. Tim kami akan membantu memaksimalkan peluang persetujuan Anda.' },
  { q: 'Dokumen apa saja yang diperlukan untuk pengajuan?', a: 'Umumnya dibutuhkan: KTP asli, BPKB asli, STNK, dan dokumen pendukung lainnya. Tim agen akan menginformasikan secara lengkap sesuai ketentuan leasing.' },
  { q: 'Bagaimana cara menjadi agen Solusi Dana Sahabat?', a: 'Calon agen dapat mengisi formulir pendaftaran di halaman Career Agen, dan tim kami akan menghubungi untuk proses selanjutnya. Tidak ada biaya pendaftaran.' },
  { q: 'Berapa lama proses pengajuan dana BPKB?', a: 'Durasi proses tergantung kelengkapan dokumen dan proses survey dari leasing. Tim agen kami memandu agar proses berjalan secepat dan selancar mungkin.' },
  { q: 'Leasing apa saja yang bekerja sama dengan Solusi Dana Sahabat?', a: 'Kami bekerja sama dengan berbagai leasing terpercaya yang beroperasi secara nasional. Tim agen akan merekomendasikan leasing yang paling sesuai dengan profil Anda.' },
  { q: 'Apakah ada biaya konsultasi?', a: 'Tidak ada biaya konsultasi. Anda dapat berkonsultasi gratis dengan tim agen kami melalui WhatsApp atau form pengajuan di website ini.' },
  { q: 'Apakah kendaraan bisa tetap digunakan saat proses pengajuan?', a: 'Hal ini tergantung kebijakan leasing yang dipilih. Tim agen kami akan menjelaskan ketentuan sesuai leasing terkait pada saat konsultasi.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <>
      <div className="pt-24 pb-14" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase" style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}>FAQ</span>
          <h1 className="text-4xl lg:text-5xl font-normal text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="text-blue-200">Jawaban atas pertanyaan umum seputar pinjaman dana BPKB motor dan mobil bersama Solusi Dana Sahabat.</p>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${open === i ? 'var(--navy-deep)' : 'var(--border)'}` }}>
                <button
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 transition-colors"
                  style={{ background: open === i ? 'rgba(12,36,97,0.04)' : 'white' }}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <h2 className="text-sm font-semibold leading-snug" style={{ color: 'var(--navy-deep)' }}>{faq.q}</h2>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-transform" style={{ background: open === i ? 'var(--navy-deep)' : 'var(--muted)', color: open === i ? 'white' : 'var(--navy-deep)', transform: open === i ? 'rotate(180deg)' : 'none' }}>↓</span>
                </button>
                {open === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 rounded-2xl text-center" style={{ background: '#f8faff', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--navy-deep)' }}>Masih Ada Pertanyaan?</h2>
            <p className="text-sm text-gray-400 mb-5">Hubungi tim agen kami langsung melalui WhatsApp, kami siap membantu.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://wa.me/6281265593904" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: '#22c55e' }}>
                💬 Chat via WhatsApp
              </a>
              <Link to="/hubungi-kami" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all hover:shadow-md" style={{ border: '2px solid var(--navy-deep)', color: 'var(--navy-deep)' }}>
                📬 Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
