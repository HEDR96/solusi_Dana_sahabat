import { useState } from 'react'

export default function Simulation() {
  const [form, setForm] = useState({
    jenis: 'motor',
    tahun: '',
    nilaiKendaraan: '',
    estimasiDana: '',
    kota: '',
    whatsapp: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const waLink = `https://wa.me/6281234567890?text=${encodeURIComponent(
    `Halo Solusi Dana Sahabat, saya ingin konsultasi pengajuan fasilitas dana BPKB ${form.jenis}. Kota: ${form.kota || '-'}. Estimasi dana: ${form.estimasiDana || '-'}.`
  )}`

  return (
    <section id="simulasi" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — copy */}
          <div className="lg:pt-4">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase"
              style={{ background: 'rgba(12,36,97,0.08)', color: 'var(--navy-deep)' }}
            >
              Simulasi Dana
            </span>
            <h2 className="text-3xl lg:text-4xl font-normal mb-5" style={{ color: 'var(--navy-deep)' }}>
              Simulasi Pengajuan Dana BPKB
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Isi form berikut untuk mendapatkan gambaran awal estimasi fasilitas dana yang dapat Anda ajukan. Tim kami akan segera menghubungi untuk konsultasi lebih lanjut.
            </p>

            <div className="space-y-4">
              {[
                { icon: '⚡', title: 'Respons Cepat', desc: 'Tim agen menghubungi dalam 1×24 jam kerja' },
                { icon: '🆓', title: 'Konsultasi Gratis', desc: 'Tidak ada biaya apapun untuk konsultasi awal' },
                { icon: '🔒', title: 'Data Aman', desc: 'Informasi Anda dijaga kerahasiaannya' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 items-start">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(12,36,97,0.07)' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--navy-deep)' }}>{item.title}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-8 p-5 rounded-xl text-sm"
              style={{ background: 'rgba(12,36,97,0.04)', border: '1px solid rgba(12,36,97,0.1)' }}
            >
              <p className="text-gray-600 leading-relaxed">
                <span className="font-semibold" style={{ color: 'var(--navy-deep)' }}>Catatan:</span> Hasil simulasi hanya perkiraan awal. Nominal dana, tenor, dan angsuran mengikuti kebijakan leasing yang berlaku.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div
            className="rounded-2xl p-7 shadow-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {!submitted ? (
              <form onSubmit={submit} className="space-y-5">
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>
                  Isi Form Simulasi
                </h3>

                {/* Jenis kendaraan */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>
                    Jenis Kendaraan *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['motor', 'mobil'].map((j) => (
                      <label
                        key={j}
                        className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border transition-all"
                        style={{
                          border: form.jenis === j ? '2px solid var(--navy-deep)' : '1px solid var(--border)',
                          background: form.jenis === j ? 'rgba(12,36,97,0.06)' : 'white',
                        }}
                      >
                        <input
                          type="radio"
                          name="jenis"
                          value={j}
                          checked={form.jenis === j}
                          onChange={handle}
                          className="hidden"
                        />
                        <span>{j === 'motor' ? '🏍️' : '🚙'}</span>
                        <span className="text-sm font-medium capitalize" style={{ color: 'var(--navy-deep)' }}>{j}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tahun kendaraan */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>Tahun Kendaraan *</label>
                  <select
                    name="tahun"
                    value={form.tahun}
                    onChange={handle}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 transition-all"
                    style={{ border: '1px solid var(--border)', background: 'white', color: form.tahun ? 'var(--foreground)' : '#9ca3af' }}
                  >
                    <option value="">Pilih tahun kendaraan</option>
                    {Array.from({ length: 15 }, (_, i) => 2024 - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Nilai kendaraan */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>Estimasi Nilai Kendaraan *</label>
                  <select
                    name="nilaiKendaraan"
                    value={form.nilaiKendaraan}
                    onChange={handle}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1px solid var(--border)', background: 'white' }}
                  >
                    <option value="">Pilih estimasi nilai kendaraan</option>
                    <option value="lt5">Di bawah Rp 5 Juta</option>
                    <option value="5-15">Rp 5 Juta - Rp 15 Juta</option>
                    <option value="15-50">Rp 15 Juta - Rp 50 Juta</option>
                    <option value="50-100">Rp 50 Juta - Rp 100 Juta</option>
                    <option value="gt100">Di atas Rp 100 Juta</option>
                  </select>
                </div>

                {/* Estimasi dana */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>Estimasi Dana Dibutuhkan *</label>
                  <select
                    name="estimasiDana"
                    value={form.estimasiDana}
                    onChange={handle}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1px solid var(--border)', background: 'white' }}
                  >
                    <option value="">Pilih estimasi dana</option>
                    <option value="lt5">Di bawah Rp 5 Juta</option>
                    <option value="5-10">Rp 5 Juta - Rp 10 Juta</option>
                    <option value="10-25">Rp 10 Juta - Rp 25 Juta</option>
                    <option value="25-50">Rp 25 Juta - Rp 50 Juta</option>
                    <option value="gt50">Di atas Rp 50 Juta</option>
                  </select>
                </div>

                {/* Kota */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>Kota Domisili *</label>
                  <input
                    type="text"
                    name="kota"
                    value={form.kota}
                    onChange={handle}
                    required
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1px solid var(--border)', background: 'white' }}
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={handle}
                    required
                    placeholder="Contoh: 081234567890"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1px solid var(--border)', background: 'white' }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{ background: 'var(--gold)' }}
                >
                  Hitung & Konsultasikan 💬
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>
                  Terima Kasih!
                </h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Data Anda telah kami terima. Tim agen Solusi Dana Sahabat akan segera menghubungi Anda dalam 1×24 jam kerja untuk konsultasi lebih lanjut.
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                  style={{ background: '#22c55e' }}
                >
                  <span>💬</span> Chat Langsung via WhatsApp
                </a>
                <button
                  className="mt-4 block w-full text-sm text-gray-400 hover:text-gray-600"
                  onClick={() => setSubmitted(false)}
                >
                  Isi ulang form
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
