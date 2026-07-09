export default function FinalCTA() {
  return (
    <section
      className="py-20 lg:py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #071640 0%, #0c2461 50%, #1e3a8a 100%)' }}
    >
      {/* Decorations */}
      <div
        className="absolute top-0 left-1/2 w-96 h-96 rounded-full pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, #e8a020, transparent 70%)', transform: 'translate(-50%, -50%)' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6 tracking-wide uppercase"
          style={{ background: 'rgba(232,160,32,0.2)', color: 'var(--gold-light)' }}
        >
          Mulai Sekarang
        </span>

        <h2 className="text-3xl lg:text-5xl font-normal text-white mb-6" style={{ fontFamily: 'DM Serif Display, serif' }}>
          Siap Mengajukan Dana atau Menjadi Agen?
        </h2>

        <p className="text-blue-200 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Pilih kebutuhan Anda sekarang. Tim Solusi Dana Sahabat siap membantu proses pengajuan dana BPKB motor dan mobil dengan layanan profesional di seluruh Indonesia.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#simulasi"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl"
            style={{ background: 'var(--gold)', boxShadow: '0 4px 24px rgba(232,160,32,0.4)' }}
          >
            <span>💳</span> Ajukan Pinjaman Dana
          </a>
          <a
            href="#career"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white border border-white/30 hover:bg-white/10 transition-all"
          >
            <span>👔</span> Daftar Jadi Agen
          </a>
        </div>

        {/* Small reassurance row */}
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {[
            '🔒 Data Aman & Terjaga',
            '💬 Konsultasi Gratis',
            '⚡ Respons Cepat',
            '🌍 Seluruh Indonesia',
          ].map((item) => (
            <span key={item} className="text-sm text-blue-200">{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
