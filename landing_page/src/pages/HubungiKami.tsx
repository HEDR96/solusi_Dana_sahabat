import { useState } from 'react'

const contacts = [
  { icon: '💬', label: 'WhatsApp', value: '0812-3456-7890', href: 'https://wa.me/6281234567890', color: '#22c55e' },
  { icon: '✉️', label: 'Email', value: 'info@solusidanasahabat.com', href: 'mailto:info@solusidanasahabat.com', color: '#3b82f6' },
  { icon: '📸', label: 'Instagram', value: '@solusidanasahabat', href: 'https://instagram.com/solusidanasahabat', color: '#ec4899' },
  { icon: '📍', label: 'Alamat', value: 'Jakarta, Indonesia — Melayani Seluruh Wilayah', href: '#', color: '#f59e0b' },
]

export default function HubungiKami() {
  const [form, setForm] = useState({ nama: '', hp: '', pesan: '' })
  const [sent, setSent] = useState(false)

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const submit = (e: React.FormEvent) => { e.preventDefault(); setSent(true) }

  return (
    <>
      <div className="pt-24 pb-14" style={{ background: 'linear-gradient(135deg, #0c2461, #1e3a8a)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase" style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}>Kontak</span>
          <h1 className="text-4xl lg:text-5xl font-normal text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Hubungi Solusi Dana Sahabat
          </h1>
          <p className="text-blue-200">Tim agen kami siap membantu konsultasi pengajuan fasilitas dana BPKB motor dan mobil di seluruh Indonesia.</p>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact info */}
            <div>
              <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Informasi Kontak</h2>
              <div className="space-y-4">
                {contacts.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-4 p-4 rounded-xl group hover:shadow-md transition-all"
                    style={{ background: '#f8faff', border: '1px solid var(--border)' }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${c.color}15` }}>{c.icon}</div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{c.label}</div>
                      <div className="text-sm font-medium group-hover:underline" style={{ color: 'var(--navy-deep)' }}>{c.value}</div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-8 p-6 rounded-2xl" style={{ background: 'var(--navy-deep)' }}>
                <h3 className="text-white font-semibold mb-3">Jam Operasional Tim</h3>
                <div className="space-y-2 text-sm">
                  {[{ day: 'Senin – Jumat', time: '08.00 – 17.00 WIB' }, { day: 'Sabtu', time: '08.00 – 14.00 WIB' }, { day: 'Minggu & Hari Libur', time: 'Terbatas (via WhatsApp)' }].map((r) => (
                    <div key={r.day} className="flex justify-between">
                      <span className="text-blue-200">{r.day}</span>
                      <span className="text-white font-medium">{r.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="rounded-2xl p-7 shadow-xl" style={{ background: '#f8faff', border: '1px solid var(--border)' }}>
              {!sent ? (
                <form onSubmit={submit} className="space-y-5">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Kirim Pesan</h2>
                  {[{ name: 'nama', label: 'Nama Lengkap', placeholder: 'Masukkan nama Anda', type: 'text' }, { name: 'hp', label: 'Nomor WhatsApp', placeholder: 'Contoh: 081234567890', type: 'tel' }].map((f) => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>{f.label} *</label>
                      <input type={f.type} name={f.name} value={(form as Record<string, string>)[f.name]} onChange={handle} required placeholder={f.placeholder} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--border)', background: 'white' }} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy-deep)' }}>Pesan / Pertanyaan *</label>
                    <textarea name="pesan" value={form.pesan} onChange={handle} required rows={4} placeholder="Tuliskan pertanyaan atau kebutuhan Anda..." className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ border: '1px solid var(--border)', background: 'white' }} />
                  </div>
                  <button type="submit" className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: 'var(--gold)' }}>
                    Kirim Pesan →
                  </button>
                </form>
              ) : (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">📬</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Pesan Terkirim!</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">Tim Solusi Dana Sahabat akan menghubungi Anda secepatnya melalui WhatsApp yang Anda berikan.</p>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: '#22c55e' }}>
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
