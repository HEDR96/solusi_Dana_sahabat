import { Link } from 'react-router'

export default function FinalCTA() {
  return (
    <section
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #030d1e 0%, #071640 40%, #0c2461 80%)' }}
    >
      {/* Decorative elements */}
      <div
        className="absolute top-0 left-1/2 pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(232,160,32,0.08) 0%, transparent 65%)',
          transform: 'translate(-50%, -40%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)',
          transform: 'translate(30%, 30%)',
        }}
      />

      {/* Gold decorative lines */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: 1, height: 60, background: 'linear-gradient(to bottom, transparent, rgba(232,160,32,0.4))' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-7 tracking-widest uppercase"
          style={{ background: 'rgba(232,160,32,0.15)', color: '#fbbf24', border: '1px solid rgba(232,160,32,0.25)' }}
        >
          Mulai Sekarang
        </span>

        <h2
          className="font-normal text-white mb-5 leading-tight"
          style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: 'clamp(1.9rem, 4vw, 3rem)',
          }}
        >
          Siap Mengajukan Dana atau
          <br />
          Bergabung sebagai Agen?
        </h2>

        <p className="text-base leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: '#64748b' }}>
          Tim Solusi Dana Sahabat siap membantu proses pengajuan pinjaman dana BPKB motor dan
          mobil dengan layanan profesional di seluruh Indonesia.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/simulasi"
            className="inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-xl text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #e8a020)', boxShadow: '0 4px 28px rgba(232,160,32,0.4)' }}
          >
            <span>💳</span>
            Ajukan Pinjaman Dana
          </Link>
          <Link
            to="/career"
            className="inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-xl text-base font-semibold text-white transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <span>👔</span>
            Daftar Jadi Agen
          </Link>
        </div>

        {/* Mini trust row */}
        <div className="flex flex-wrap justify-center gap-6">
          {['🔒 Data Aman & Terjaga', '💬 Konsultasi Gratis', '⚡ Respons Cepat', '🌍 Seluruh Indonesia'].map((item) => (
            <span key={item} className="text-xs font-medium" style={{ color: '#475569' }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
