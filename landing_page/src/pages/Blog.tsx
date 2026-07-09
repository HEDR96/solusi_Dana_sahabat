import { Link } from 'react-router'
import { blogPosts } from '../data/blogPosts'
import { useMeta } from '../hooks/useMeta'

const categoryColors: Record<string, string> = {
  Panduan: '#0c2461',
  Edukasi: '#1d4ed8',
  Tips: '#e8a020',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Blog() {
  useMeta({
    title: 'Blog – Tips & Panduan Pinjaman Dana BPKB',
    description: 'Artikel dan panduan seputar pinjaman dana BPKB motor dan mobil, tips lolos survey, syarat dokumen, dan informasi leasing terpercaya dari Solusi Dana Sahabat.',
  })

  const [featured, ...rest] = blogPosts

  return (
    <>
      {/* Page header */}
      <div className="pt-24 pb-16" style={{ background: 'linear-gradient(135deg, #071640 0%, #0c2461 55%, #1e3a8a 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
            style={{ background: 'rgba(232,160,32,0.18)', color: '#fbbf24', border: '1px solid rgba(232,160,32,0.3)' }}
          >
            Blog & Artikel
          </span>
          <h1
            className="text-4xl lg:text-5xl font-normal text-white mb-4"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Tips & Panduan Pinjaman Dana BPKB
          </h1>
          <p className="text-blue-200 leading-relaxed max-w-2xl mx-auto">
            Pelajari cara mengajukan pinjaman dana BPKB motor dan mobil, tips lolos survey,
            syarat dokumen, dan informasi terpercaya seputar fasilitas dana.
          </p>
        </div>
      </div>

      <section className="py-16 lg:py-20" style={{ background: '#f8faff' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Featured post */}
          <div className="mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--navy-deep)' }}>
              Artikel Pilihan
            </p>
            <Link
              to={`/blog/${featured.slug}`}
              className="group grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ border: '1px solid var(--border)', background: 'white' }}
            >
              <div className="h-64 md:h-auto overflow-hidden relative" style={{ background: '#1e3a8a' }}>
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(12,36,97,0.5) 0%, transparent 60%)' }} />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <span
                  className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold mb-4 w-fit"
                  style={{ background: `${categoryColors[featured.category]}15`, color: categoryColors[featured.category] }}
                >
                  {featured.category}
                </span>
                <h2
                  className="text-2xl lg:text-3xl font-normal mb-4 group-hover:text-blue-700 transition-colors"
                  style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif', lineHeight: 1.3 }}
                >
                  {featured.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{formatDate(featured.date)}</span>
                  <span>·</span>
                  <span>{featured.readTime} menit baca</span>
                </div>
                <div
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all"
                  style={{ color: 'var(--navy-deep)' }}
                >
                  Baca Selengkapnya →
                </div>
              </div>
            </Link>
          </div>

          {/* Other posts grid */}
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--navy-deep)' }}>
            Artikel Lainnya
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rest.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'white', border: '1px solid var(--border)' }}
              >
                <div className="h-44 overflow-hidden relative" style={{ background: '#1e3a8a' }}>
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,36,97,0.6), transparent 60%)' }} />
                  <span
                    className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-semibold text-white"
                    style={{ background: categoryColors[post.category] }}
                  >
                    {post.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3
                    className="text-sm font-semibold leading-snug mb-3 group-hover:text-blue-700 transition-colors"
                    style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}
                  >
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(post.date)}</span>
                    <span>{post.readTime} mnt</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div
            className="mt-16 rounded-2xl px-8 py-10 text-center"
            style={{ background: 'linear-gradient(135deg, #071640, #0c2461)' }}
          >
            <h2
              className="text-2xl lg:text-3xl font-normal text-white mb-3"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              Siap Mengajukan Pinjaman Dana BPKB?
            </h2>
            <p className="text-blue-200 text-sm mb-7 max-w-xl mx-auto">
              Konsultasikan gratis dengan tim agen Solusi Dana Sahabat. Kami siap membantu dari awal pengajuan hingga dana cair.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/simulasi"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'var(--gold)' }}
              >
                💳 Ajukan Pinjaman Dana
              </Link>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white border border-white/25 hover:bg-white/10 transition-all"
              >
                💬 Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
