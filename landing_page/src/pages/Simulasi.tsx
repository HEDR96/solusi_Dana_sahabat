import { useState } from 'react'

// Inquiry disimpan lewat endpoint publik ERP (service key di server).
// Insert langsung dengan anon key selalu ditolak RLS — form dulu tidak pernah berhasil.
const LEAD_API = 'https://solusi-dana-sahabat.vercel.app/api/lead'

export default function Simulasi() {
  const [form, setForm] = useState({ jenis: 'motor', tahun: '', nilaiKendaraan: '', estimasiDana: '', kota: '', whatsapp: '', website: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const resp = await fetch(LEAD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inquiry',
          jenis: form.jenis, tahun: form.tahun, nilaiKendaraan: form.nilaiKendaraan,
          estimasiDana: form.estimasiDana, kota: form.kota, whatsapp: form.whatsapp,
          website: form.website,
        }),
      })
      setLoading(false)
      if (!resp.ok) {
        const result = await resp.json().catch(() => ({}))
        setErrorMsg(result.error || 'Gagal mengirim data. Silakan coba lagi.')
        return
      }
      setSubmitted(true)
    } catch {
      setLoading(false)
      setErrorMsg('Gagal mengirim data. Periksa koneksi internet Anda.')
    }
  }

  const waLink = `https://wa.me/6281265593904?text=${encodeURIComponent(
    `Halo Solusi Dana Sahabat, saya ingin konsultasi pengajuan fasilitas dana BPKB ${form.jenis}. Kota: ${form.kota || '-'}. Estimasi dana: ${form.estimasiDana || '-'}.`
  )}`

  return (
    <>
      <div className="pt-24 pb-14" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase" style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}>Simulasi Dana</span>
          <h1 className="text-4xl lg:text-5xl font-normal text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Simulasi Pengajuan Dana BPKB
          </h1>
          <p className="text-blue-200">Isi form berikut untuk mendapatkan gambaran awal estimasi fasilitas dana yang dapat Anda ajukan.</p>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Kenapa Simulasi Dulu?</h2>
                <p className="text-sm text-gray-500 leading-relaxed">Simulasi membantu tim agen kami memahami kebutuhan Anda sebelum proses pengajuan resmi, sehingga konsultasi lebih terarah dan efisien.</p>
              </div>
              {[{ icon: '⚡', title: 'Respons Cepat', desc: 'Tim menghubungi dalam 1×24 jam kerja' }, { icon: '🆓', title: 'Konsultasi Gratis', desc: 'Tidak ada biaya apapun untuk konsultasi' }, { icon: '🔒', title: 'Data Aman', desc: 'Informasi Anda dijaga kerahasiaannya' }].map((item) => (
                <div key={item.title} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(12,36,97,0.07)' }}>{item.icon}</div>
                  <div>
                    <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--navy-deep)' }}>{item.title}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                </div>
              ))}
              <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.2)', color: '#92400e' }}>
                <strong>Catatan:</strong> Hasil simulasi hanya perkiraan awal. Nominal dana, tenor, dan angsuran mengikuti kebijakan leasing yang berlaku.
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3 rounded-2xl p-7 shadow-xl" style={{ background: '#f8faff', border: '1px solid var(--border)' }}>
              {!submitted ? (
                <form onSubmit={submit} className="space-y-5">
                  {/* Honeypot anti-bot — tidak terlihat manusia, bot mengisinya */}
                  <input type="text" name="website" value={form.website} onChange={handle} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }} />
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Isi Form Simulasi</h2>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>Jenis Kendaraan *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['motor', 'mobil'].map((j) => (
                        <label key={j} className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all" style={{ border: form.jenis === j ? '2px solid var(--navy-deep)' : '1px solid var(--border)', background: form.jenis === j ? 'rgba(12,36,97,0.06)' : 'white' }}>
                          <input type="radio" name="jenis" value={j} checked={form.jenis === j} onChange={handle} className="hidden" />
                          <span>{j === 'motor' ? '🏍️' : '🚙'}</span>
                          <span className="text-sm font-medium capitalize" style={{ color: 'var(--navy-deep)' }}>{j}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {[
                    { name: 'tahun', label: 'Tahun Kendaraan', type: 'select', options: Array.from({ length: 15 }, (_, i) => ({ value: String(2024 - i), label: String(2024 - i) })) },
                    { name: 'nilaiKendaraan', label: 'Estimasi Nilai Kendaraan', type: 'select', options: [{ value: 'lt5', label: 'Di bawah Rp 5 Juta' }, { value: '5-15', label: 'Rp 5 Juta - Rp 15 Juta' }, { value: '15-50', label: 'Rp 15 Juta - Rp 50 Juta' }, { value: '50-100', label: 'Rp 50 Juta - Rp 100 Juta' }, { value: 'gt100', label: 'Di atas Rp 100 Juta' }] },
                    { name: 'estimasiDana', label: 'Estimasi Dana Dibutuhkan', type: 'select', options: [{ value: 'lt5', label: 'Di bawah Rp 5 Juta' }, { value: '5-10', label: 'Rp 5 Juta - Rp 10 Juta' }, { value: '10-25', label: 'Rp 10 Juta - Rp 25 Juta' }, { value: '25-50', label: 'Rp 25 Juta - Rp 50 Juta' }, { value: 'gt50', label: 'Di atas Rp 50 Juta' }] },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>{f.label} *</label>
                      <select name={f.name} value={(form as Record<string, string>)[f.name]} onChange={handle} required className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--border)', background: 'white' }}>
                        <option value="">Pilih {f.label.toLowerCase()}</option>
                        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}

                  {[{ name: 'kota', label: 'Kota Domisili', placeholder: 'Contoh: Jakarta Selatan', type: 'text' }, { name: 'whatsapp', label: 'Nomor WhatsApp', placeholder: 'Contoh: 081234567890', type: 'tel' }].map((f) => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>{f.label} *</label>
                      <input type={f.type} name={f.name} value={(form as Record<string, string>)[f.name]} onChange={handle} required placeholder={f.placeholder} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--border)', background: 'white' }} />
                    </div>
                  ))}

                  {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
                  <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60" style={{ background: 'var(--gold)' }}>
                    {loading ? 'Mengirim...' : 'Hitung & Konsultasikan 💬'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Terima Kasih!</h2>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">Tim agen Solusi Dana Sahabat akan menghubungi Anda dalam 1×24 jam kerja untuk konsultasi lebih lanjut.</p>
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: '#22c55e' }}>
                    💬 Chat Langsung via WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
