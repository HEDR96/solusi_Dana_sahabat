import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router'

const navLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Layanan', to: '/layanan' },
  { label: 'Simulasi', to: '/simulasi' },
  { label: 'Keunggulan', to: '/keunggulan' },
  { label: 'Cara Pengajuan', to: '/cara-pengajuan' },
  { label: 'Career Agen', to: '/career' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Hubungi Kami', to: '/hubungi-kami' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(12,36,97,0.97)' : 'rgba(12,36,97,0.85)',
        backdropFilter: 'blur(12px)',
        boxShadow: scrolled ? '0 2px 24px rgba(12,36,97,0.18)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ background: 'var(--gold)' }}
            >
              SDS
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'DM Serif Display, serif' }}>
                Solusi Dana
              </div>
              <div className="text-xs leading-tight" style={{ color: 'var(--gold-light)', letterSpacing: '0.08em' }}>
                SAHABAT
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'text-white bg-white/15 font-medium'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex">
            <Link
              to="/simulasi"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'var(--gold)', boxShadow: '0 2px 12px rgba(232,160,32,0.35)' }}
            >
              Ajukan Sekarang
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <div className="w-5 space-y-1">
              <span className={`block h-0.5 bg-white transition-all duration-200 ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-white transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-white transition-all duration-200 ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden" style={{ background: 'rgba(12,36,97,0.98)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    isActive ? 'text-white bg-white/15 font-medium' : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-2">
              <Link
                to="/simulasi"
                className="block text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: 'var(--gold)' }}
                onClick={() => setOpen(false)}
              >
                Ajukan Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
