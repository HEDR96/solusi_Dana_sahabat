import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f8faff' }}>
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>Halaman Tidak Ditemukan</h1>
        <p className="text-gray-400 mb-8">Halaman yang Anda cari tidak tersedia. Silakan kembali ke beranda.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white" style={{ background: 'var(--navy-deep)' }}>
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
