import { useState } from 'react'

// Lead disimpan lewat endpoint publik ERP (service key di server).
// Insert langsung dengan anon key selalu ditolak RLS — form dulu tidak pernah berhasil.
const LEAD_API = 'https://solusi-dana-sahabat.vercel.app/api/lead'

const benefits = [
  { icon: '🏠', text: 'Bisa bekerja dari mana saja, fleksibel waktu' },
  { icon: '💰', text: 'Komisi menarik dari setiap pengajuan yang berhasil disetujui' },
  { icon: '📈', text: 'Produk fasilitas dana BPKB dibutuhkan banyak masyarakat' },
  { icon: '🛠️', text: 'Dibantu sistem dan tim support penuh dari pusat' },
  { icon: '🌐', text: 'Cocok untuk individu, sales, komunitas, dan jaringan marketing' },
  { icon: '📱', text: 'Cukup aktif WhatsApp, bisa langsung mulai bergabung' },
]

export default function Career() {
  const [form, setForm] = useState({ nama: '', hp: '', kota: '', pengalaman: '', website: '' })
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
          type: 'career',
          nama: form.nama, hp: form.hp, kota: form.kota, pengalaman: form.pengalaman,
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

  return (
    <>
      <div className="pt-24 pb-14" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase" style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}>Career Agen</span>
          <h1 className="text-4xl lg:text-5xl font-normal text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Gabung Menjadi Agen Solusi Dana Sahabat
          </h1>
          <p className="text-blue-200 leading-relaxed">Buka peluang penghasilan tambahan dengan menjadi agen fasilitas dana BPKB motor dan mobil di wilayah Anda.</p>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left */}
            <div className="lg:col-span-3 space-y-8">
              {/* Job card */}
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid var(--border)' }}>
                <div className="px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(232,160,32,0.2)', border: '1px solid rgba(232,160,32,0.3)' }}>👔</div>
                    <div>
                      <h2 className="font-bold text-xl" style={{ fontFamily: 'DM Serif Display, serif' }}>Agen Dana BPKB</h2>
                      <div className="text-xs text-blue-200">Solusi Dana Sahabat · Seluruh Indonesia</div>
                    </div>
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--gold)' }}>⚡ Dibuka Sekarang</div>
                </div>
                <div className="p-6 bg-white">
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    Bertugas mencari dan membantu calon nasabah untuk pengajuan pinjaman dana dengan jaminan BPKB motor atau mobil melalui sistem Solusi Dana Sahabat.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--navy-deep)' }}>Tanggung Jawab</h3>
                      <ul className="space-y-2">
                        {['Mencari calon nasabah', 'Membantu input data pengajuan', 'Mengarahkan ke proses survey', 'Koordinasi dengan tim pusat'].map((r) => (
                          <li key={r} className="flex items-start gap-2 text-sm text-gray-500">
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--navy-deep)' }}>Syarat</h3>
                      <ul className="space-y-2">
                        {['Punya jaringan atau komunikasi baik', 'Aktif menggunakan WhatsApp', 'Jujur dan bertanggung jawab', 'Pengalaman sales jadi nilai tambah'].map((r) => (
                          <li key={r} className="flex items-start gap-2 text-sm text-gray-500">
                            <span className="text-yellow-500 mt-0.5 flex-shrink-0">•</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h2 className="text-xl font-semibold mb-5" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Keuntungan Menjadi Agen</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {benefits.map((b) => (
                    <div key={b.text} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#f8faff', border: '1px solid var(--border)' }}>
                      <span className="text-xl flex-shrink-0">{b.icon}</span>
                      <span className="text-sm text-gray-600 leading-snug">{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl p-7 shadow-xl sticky top-24" style={{ background: '#f8faff', border: '1px solid var(--border)' }}>
                {!submitted ? (
                  <form onSubmit={submit} className="space-y-4">
                    {/* Honeypot anti-bot — tidak terlihat manusia, bot mengisinya */}
                    <input type="text" name="website" value={form.website} onChange={handle} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }} />
                    <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Daftar Jadi Agen</h2>
                    <p className="text-sm text-gray-400 mb-4">Isi data di bawah, tim kami akan menghubungi Anda secepatnya.</p>
                    {[{ name: 'nama', label: 'Nama Lengkap', placeholder: 'Masukkan nama lengkap', type: 'text' }, { name: 'hp', label: 'Nomor WhatsApp', placeholder: 'Contoh: 081234567890', type: 'tel' }, { name: 'kota', label: 'Kota Domisili', placeholder: 'Contoh: Surabaya', type: 'text' }].map((f) => (
                      <div key={f.name}>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>{f.label} *</label>
                        <input type={f.type} name={f.name} value={(form as Record<string, string>)[f.name]} onChange={handle} required placeholder={f.placeholder} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--border)', background: 'white' }} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>Pengalaman Sales</label>
                      <select name="pengalaman" value={form.pengalaman} onChange={handle} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--border)', background: 'white' }}>
                        <option value="">Pilih pengalaman</option>
                        <option value="belum">Belum ada pengalaman</option>
                        <option value="lt1">Kurang dari 1 tahun</option>
                        <option value="1-3">1 - 3 tahun</option>
                        <option value="gt3">Lebih dari 3 tahun</option>
                      </select>
                    </div>
                    {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
                      {loading ? 'Mengirim...' : 'Daftar Jadi Agen Sekarang →'}
                    </button>
                    <p className="text-center text-xs text-gray-400">Data Anda aman dan hanya digunakan untuk proses rekrutmen agen.</p>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Pendaftaran Diterima!</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Tim Solusi Dana Sahabat akan menghubungi Anda dalam 1×24 jam. Selamat bergabung!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
