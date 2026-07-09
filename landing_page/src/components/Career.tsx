import { useState } from 'react'

const benefits = [
  { icon: '🏠', text: 'Bisa bekerja dari mana saja' },
  { icon: '💰', text: 'Komisi menarik dari setiap pengajuan berhasil' },
  { icon: '📈', text: 'Produk dibutuhkan banyak masyarakat' },
  { icon: '🛠️', text: 'Dibantu sistem dan tim support penuh' },
  { icon: '🌐', text: 'Cocok untuk individu, sales, komunitas, jaringan marketing' },
  { icon: '📱', text: 'Cukup aktif WhatsApp, bisa langsung mulai' },
]

export default function Career() {
  const [form, setForm] = useState({ nama: '', hp: '', kota: '', pengalaman: '' })
  const [submitted, setSubmitted] = useState(false)

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const submit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true) }

  return (
    <section
      id="career"
      className="py-20 lg:py-28 relative overflow-hidden"
      style={{ background: '#f8faff' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase"
            style={{ background: 'rgba(232,160,32,0.15)', color: '#92400e' }}
          >
            Career Agen
          </span>
          <h2 className="text-3xl lg:text-4xl font-normal mb-4" style={{ color: 'var(--navy-deep)' }}>
            Gabung Menjadi Agen Solusi Dana Sahabat
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Buka peluang penghasilan tambahan dengan menjadi agen fasilitas dana BPKB motor dan mobil di wilayah Anda. Tidak perlu modal besar, cukup jaringan dan semangat!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left — job card + benefits */}
          <div>
            {/* Job card */}
            <div
              className="rounded-2xl overflow-hidden mb-8 shadow-lg"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'rgba(232,160,32,0.2)', border: '1px solid rgba(232,160,32,0.3)' }}
                  >
                    👔
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ fontFamily: 'DM Serif Display, serif' }}>Agen Dana BPKB</div>
                    <div className="text-xs text-blue-200">Solusi Dana Sahabat · Seluruh Indonesia</div>
                  </div>
                </div>
                <div
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold mt-1"
                  style={{ background: 'var(--gold)', color: 'white' }}
                >
                  ⚡ Dibuka Sekarang
                </div>
              </div>
              <div className="px-6 py-5 bg-white">
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  Bertugas mencari dan membantu calon nasabah untuk pengajuan pinjaman dana dengan jaminan BPKB motor atau mobil melalui sistem Solusi Dana Sahabat.
                </p>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--navy-deep)' }}>Tanggung Jawab</h4>
                    <ul className="space-y-2">
                      {['Mencari calon nasabah', 'Membantu input data pengajuan', 'Mengarahkan ke proses survey', 'Koordinasi dengan tim pusat'].map((r) => (
                        <li key={r} className="flex items-start gap-2 text-xs text-gray-500">
                          <span className="text-blue-500 mt-0.5">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--navy-deep)' }}>Syarat</h4>
                    <ul className="space-y-2">
                      {['Punya jaringan atau komunikasi baik', 'Aktif menggunakan WhatsApp', 'Jujur, bertanggung jawab', 'Pengalaman sales jadi nilai tambah'].map((r) => (
                        <li key={r} className="flex items-start gap-2 text-xs text-gray-500">
                          <span className="text-yellow-500 mt-0.5">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--navy-deep)' }}>Keuntungan Menjadi Agen</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {benefits.map((b) => (
                <div
                  key={b.text}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'white', border: '1px solid var(--border)' }}
                >
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-sm text-gray-600 leading-tight">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — registration form */}
          <div
            className="rounded-2xl p-7 sticky top-24 shadow-xl"
            style={{ background: 'white', border: '1px solid var(--border)' }}
          >
            {!submitted ? (
              <form onSubmit={submit} className="space-y-4">
                <h3 className="text-xl font-semibold mb-1" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>
                  Daftar Jadi Agen
                </h3>
                <p className="text-sm text-gray-400 mb-4">Isi data di bawah, tim kami akan menghubungi Anda.</p>

                {[
                  { name: 'nama', label: 'Nama Lengkap', placeholder: 'Masukkan nama lengkap', type: 'text' },
                  { name: 'hp', label: 'Nomor WhatsApp', placeholder: 'Contoh: 081234567890', type: 'tel' },
                  { name: 'kota', label: 'Kota Domisili', placeholder: 'Contoh: Surabaya', type: 'text' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>{f.label} *</label>
                    <input
                      type={f.type}
                      name={f.name}
                      value={(form as Record<string, string>)[f.name]}
                      onChange={handle}
                      required
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ border: '1px solid var(--border)', background: '#f8faff' }}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>Pengalaman di Bidang Sales</label>
                  <select
                    name="pengalaman"
                    value={form.pengalaman}
                    onChange={handle}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1px solid var(--border)', background: '#f8faff' }}
                  >
                    <option value="">Pilih pengalaman</option>
                    <option value="belum">Belum ada pengalaman</option>
                    <option value="lt1">Kurang dari 1 tahun</option>
                    <option value="1-3">1 - 3 tahun</option>
                    <option value="gt3">Lebih dari 3 tahun</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)', boxShadow: '0 4px 16px rgba(12,36,97,0.25)' }}
                >
                  Daftar Jadi Agen Sekarang →
                </button>

                <p className="text-center text-xs text-gray-400">Data Anda aman dan hanya digunakan untuk proses rekrutmen agen</p>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Pendaftaran Diterima!</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Tim Solusi Dana Sahabat akan menghubungi Anda dalam 1×24 jam untuk proses selanjutnya. Selamat bergabung!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
