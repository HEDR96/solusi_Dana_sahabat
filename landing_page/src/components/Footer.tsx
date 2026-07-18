import { Link } from 'react-router'
import Logo from './Logo'

const navLinks = {
  Layanan: [
    { label: 'Pinjaman BPKB Motor', to: '/layanan' },
    { label: 'Pinjaman BPKB Mobil', to: '/layanan' },
    { label: 'Simulasi Dana', to: '/simulasi' },
    { label: 'Cara Pengajuan', to: '/cara-pengajuan' },
    { label: 'Keunggulan Kami', to: '/keunggulan' },
  ],
  Perusahaan: [
    { label: 'Career Agen', to: '/career' },
    { label: 'Blog & Artikel', to: '/blog' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Hubungi Kami', to: '/hubungi-kami' },
    { label: 'Kebijakan Privasi', to: '/kebijakan-privasi' },
  ],
}

export default function Footer() {
  return (
    <footer style={{ background: '#030d1e', color: '#94a3b8' }}>
      {/* Top trust bar */}
      <div style={{ background: '#071640', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            {[
              { icon: '🔒', text: 'Data Nasabah Aman' },
              { icon: '💬', text: 'Konsultasi Gratis' },
              { icon: '⚡', text: 'Respons 1×24 Jam' },
              { icon: '🌍', text: 'Seluruh Indonesia' },
              { icon: '🏦', text: '10+ Mitra Leasing' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 text-sm" style={{ color: '#93c5fd' }}>
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo variant="light" size="md" />
            <p className="text-sm leading-relaxed mt-4 mb-6 max-w-sm" style={{ color: '#64748b' }}>
              Solusi Dana Sahabat adalah mitra terpercaya untuk fasilitas pinjaman dana dengan
              jaminan BPKB motor dan mobil, tersedia di seluruh Indonesia melalui jaringan
              leasing resmi dan agen profesional.
            </p>

            <div className="space-y-3">
              <a
                href="https://wa.me/6281265593904"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: '#22c55e1a' }}>
                  <span>💬</span>
                </div>
                <div>
                  <div className="text-xs" style={{ color: '#475569' }}>WhatsApp</div>
                  <div className="text-white/80 group-hover:text-white text-sm font-medium">0812-3456-7890</div>
                </div>
              </a>
              <a
                href="mailto:info@solusidanasahabat.com"
                className="flex items-center gap-3 text-sm hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#3b82f61a' }}>
                  <span>✉️</span>
                </div>
                <div>
                  <div className="text-xs" style={{ color: '#475569' }}>Email</div>
                  <div className="text-white/80 group-hover:text-white text-sm font-medium">info@solusidanasahabat.com</div>
                </div>
              </a>
              <a
                href="https://instagram.com/solusidanasahabat"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#ec48991a' }}>
                  <span>📸</span>
                </div>
                <div>
                  <div className="text-xs" style={{ color: '#475569' }}>Instagram</div>
                  <div className="text-white/80 group-hover:text-white text-sm font-medium">@solusidanasahabat</div>
                </div>
              </a>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b1a' }}>
                  <span>📍</span>
                </div>
                <div>
                  <div className="text-xs" style={{ color: '#475569' }}>Wilayah</div>
                  <div className="text-white/70 text-sm">Jakarta — Seluruh Indonesia</div>
                </div>
              </div>
            </div>
          </div>

          {Object.entries(navLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold text-white mb-5 uppercase tracking-widest">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: '#64748b' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p style={{ color: '#334155' }}>
            © 2026 <span className="text-white/50">Solusi Dana Sahabat</span>. Semua hak dilindungi.
          </p>
          <p style={{ color: '#1e293b' }}>
            Proses pengajuan mengikuti ketentuan dan kebijakan dari pihak leasing terkait.
          </p>
        </div>
      </div>
    </footer>
  )
}
