import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router'
import Logo from './Logo'

const navLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Layanan', to: '/layanan' },
  { label: 'Simulasi', to: '/simulasi' },
  { label: 'Keunggulan', to: '/keunggulan' },
  { label: 'Cara Pengajuan', to: '/cara-pengajuan' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Hubungi Kami', to: '/hubungi-kami' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(7,22,64,0.97)' : 'rgba(7,22,64,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.28)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" aria-label="Solusi Dana Sahabat – Beranda">
            <Logo variant="light" size="sm" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center" aria-label="Menu utama">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 text-[13px] rounded-lg transition-colors font-medium ${
                    isActive
                      ? 'text-white bg-white/15'
                      : 'text-blue-100/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/career"
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white/80 hover:text-white border border-white/20 hover:border-white/40 transition-all"
            >
              Jadi Agen
            </Link>
            <Link
              to="/simulasi"
              className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: 'var(--gold)', boxShadow: '0 2px 12px rgba(232,160,32,0.35)' }}
            >
              Ajukan Sekarang
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <div className="w-5 space-y-[5px]">
              <span className={`block h-0.5 bg-white transition-all duration-200 origin-left ${open ? 'rotate-45 translate-y-0 w-[18px]' : 'w-5'}`} />
              <span className={`block h-0.5 bg-white transition-all duration-200 ${open ? 'opacity-0 w-0' : 'w-5'}`} />
              <span className={`block h-0.5 bg-white transition-all duration-200 origin-left ${open ? '-rotate-45 translate-y-0 w-[18px]' : 'w-5'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ background: 'rgba(7,22,64,0.98)', borderTop: open ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `block px-4 py-2.5 text-sm rounded-xl transition-colors ${
                  isActive ? 'text-white bg-white/15 font-medium' : 'text-blue-100/80 hover:text-white hover:bg-white/10'
                }`
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-3 pb-2 grid grid-cols-2 gap-2">
            <Link
              to="/career"
              className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-white border border-white/20"
              onClick={() => setOpen(false)}
            >
              Jadi Agen
            </Link>
            <Link
              to="/simulasi"
              className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--gold)' }}
              onClick={() => setOpen(false)}
            >
              Ajukan Sekarang
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
