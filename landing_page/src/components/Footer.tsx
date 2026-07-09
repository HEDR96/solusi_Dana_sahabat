import { Link } from 'react-router'

const footerLinks = {
  Navigasi: [
    { label: 'Beranda', to: '/' },
    { label: 'Layanan', to: '/layanan' },
    { label: 'Simulasi', to: '/simulasi' },
    { label: 'Keunggulan', to: '/keunggulan' },
    { label: 'Cara Pengajuan', to: '/cara-pengajuan' },
  ],
  Perusahaan: [
    { label: 'Career Agen', to: '/career' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Hubungi Kami', to: '/hubungi-kami' },
    { label: 'Kebijakan Privasi', to: '#' },
    { label: 'Syarat & Ketentuan', to: '#' },
  ],
}

export default function Footer() {
  return (
    <footer id="kontak" style={{ background: '#040f2b', color: '#94a3b8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--gold)' }}>SDS</div>
              <div>
                <div className="font-bold text-white text-base" style={{ fontFamily: 'DM Serif Display, serif' }}>Solusi Dana Sahabat</div>
                <div className="text-xs" style={{ color: 'var(--gold-light)', letterSpacing: '0.08em' }}>FASILITAS DANA BPKB</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              Solusi Dana Sahabat adalah layanan penyedia fasilitas dana dengan jaminan BPKB motor dan mobil melalui berbagai mitra leasing terpercaya di seluruh Indonesia.
            </p>
            <div className="space-y-2.5">
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm hover:text-white transition-colors">
                <span className="text-green-400">💬</span><span>WhatsApp: 0812-3456-7890</span>
              </a>
              <a href="mailto:info@solusidanasahabat.com" className="flex items-center gap-2.5 text-sm hover:text-white transition-colors">
                <span className="text-blue-400">✉️</span><span>info@solusidanasahabat.com</span>
              </a>
              <a href="https://instagram.com/solusidanasahabat" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm hover:text-white transition-colors">
                <span className="text-pink-400">📸</span><span>@solusidanasahabat</span>
              </a>
              <div className="flex items-start gap-2.5 text-sm">
                <span className="text-yellow-400 mt-0.5">📍</span><span>Jakarta, Indonesia — Melayani Seluruh Wilayah</span>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p>© 2026 Solusi Dana Sahabat. Semua hak dilindungi.</p>
          <p style={{ color: '#475569' }}>Proses pengajuan mengikuti ketentuan dan kebijakan dari pihak leasing terkait.</p>
        </div>
      </div>
    </footer>
  )
}
