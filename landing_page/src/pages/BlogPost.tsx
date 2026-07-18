import { useParams, Link, Navigate } from 'react-router'
import { blogPosts } from '../data/blogPosts'
import { useMeta } from '../hooks/useMeta'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function renderContent(md: string) {
  const lines = md.trim().split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-2xl font-normal mt-10 mb-4" style={{ color: 'var(--navy-deep)', fontFamily: 'DM Serif Display, serif' }}>
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-6 mb-3" style={{ color: 'var(--navy-deep)' }}>
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2))
        i++
      }
      elements.push(
        <ul key={i} className="space-y-2 mb-4 ml-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-gray-600 text-sm leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--gold)' }} />
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </li>
          ))}
        </ul>
      )
      continue
    } else if (line.startsWith('1. ') || line.startsWith('2. ')) {
      const items: string[] = []
      let n = 1
      while (i < lines.length && lines[i].trim().match(/^\d+\. /)) {
        items.push(lines[i].trim().replace(/^\d+\. /, ''))
        i++
      }
      elements.push(
        <ol key={i} className="space-y-2 mb-4 ml-2 list-none">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{ background: 'var(--navy-deep)', marginTop: 1 }}
              >
                {j + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </li>
          ))}
        </ol>
      )
      continue
    } else if (line.startsWith('| ')) {
      // Simple table
      const rows: string[][] = []
      let isHeader = true
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (lines[i].trim().startsWith('|---') || lines[i].trim().startsWith('| ---')) { i++; isHeader = false; continue }
        const cells = lines[i].trim().split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim())
        rows.push(cells)
        i++
      }
      elements.push(
        <div key={i} className="overflow-x-auto my-6 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--navy-deep)' }}>
                {rows[0]?.map((cell, j) => (
                  <th key={j} className="px-4 py-3 text-left font-semibold text-white">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, j) => (
                <tr key={j} style={{ background: j % 2 === 0 ? 'white' : '#f8faff' }}>
                  {row.map((cell, k) => (
                    <td key={k} className="px-4 py-3 text-gray-600 border-t" style={{ borderColor: 'var(--border)' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    } else if (line === '') {
      // skip blank lines
    } else if (line.startsWith('*Catatan:') || line.startsWith('*Note:')) {
      elements.push(
        <p key={i}
          className="text-sm italic text-gray-400 my-4 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(12,36,97,0.04)', borderLeft: '3px solid var(--gold)' }}
          dangerouslySetInnerHTML={{ __html: line.replace(/\*/g, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
        />
      )
    } else {
      elements.push(
        <p
          key={i}
          className="text-gray-600 leading-relaxed mb-4 text-[15px]"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
        />
      )
    }
    i++
  }

  return elements
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = blogPosts.find(p => p.slug === slug)
  const related = blogPosts.filter(p => p.slug !== slug).slice(0, 3)

  useMeta({
    title: post?.title || 'Artikel',
    description: post?.excerpt,
    ogImage: post?.image,
  })

  if (!post) return <Navigate to="/blog" replace />

  return (
    <>
      {/* Hero */}
      <div className="relative pt-24 pb-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #071640, #0c2461)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-blue-300 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Beranda</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-blue-200 truncate max-w-xs">{post.category}</span>
          </div>

          <span
            className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold mb-5"
            style={{ background: 'rgba(232,160,32,0.2)', color: '#fbbf24' }}
          >
            {post.category}
          </span>

          <h1
            className="text-3xl lg:text-4xl font-normal text-white mb-5 leading-tight"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-blue-300 pb-8">
            <span>Solusi Dana Sahabat</span>
            <span>·</span>
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readTime} menit baca</span>
          </div>
        </div>
      </div>

      {/* Featured image */}
      <div style={{ background: '#0c2461' }}>
        <div className="max-w-4xl mx-auto">
          <img
            src={post.image}
            alt={post.title}
            className="w-full"
            style={{ height: 340, objectFit: 'cover', opacity: 0.9 }}
          />
        </div>
      </div>

      {/* Content */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Main content */}
            <article className="lg:col-span-2">
              {/* Excerpt */}
              <div
                className="p-5 rounded-xl mb-8 text-sm text-gray-600 leading-relaxed"
                style={{ background: '#f0f4ff', borderLeft: '4px solid var(--navy-deep)' }}
              >
                {post.excerpt}
              </div>

              <div className="prose-content">
                {renderContent(post.content)}
              </div>

              {/* Tags */}
              <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {post.keywords.map(kw => (
                    <span
                      key={kw}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'rgba(12,36,97,0.07)', color: 'var(--navy-deep)' }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA box */}
              <div
                className="mt-10 p-7 rounded-2xl text-center"
                style={{ background: 'linear-gradient(135deg, #071640, #0c2461)' }}
              >
                <div className="text-2xl mb-3">💬</div>
                <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Butuh Konsultasi?
                </h3>
                <p className="text-blue-200 text-sm mb-5">
                  Tim agen Solusi Dana Sahabat siap membantu pengajuan pinjaman dana BPKB Anda. Gratis & tanpa komitmen.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/simulasi"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: 'var(--gold)' }}
                  >
                    Ajukan Sekarang
                  </Link>
                  <a
                    href="https://wa.me/6281265593904"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white border border-white/25 hover:bg-white/10 transition-all"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-7">
                {/* Quick info */}
                <div className="p-6 rounded-2xl" style={{ background: '#f8faff', border: '1px solid var(--border)' }}>
                  <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--navy-deep)' }}>
                    Layanan Kami
                  </h4>
                  <div className="space-y-3">
                    {[
                      { icon: '🏍️', label: 'Pinjaman BPKB Motor' },
                      { icon: '🚙', label: 'Pinjaman BPKB Mobil' },
                      { icon: '💬', label: 'Konsultasi Gratis' },
                      { icon: '🌍', label: 'Seluruh Indonesia' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3 text-sm text-gray-600">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/simulasi"
                    className="mt-5 w-full flex items-center justify-center py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--navy-deep)' }}
                  >
                    Simulasi Dana →
                  </Link>
                </div>

                {/* Related posts */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--navy-deep)' }}>
                    Artikel Terkait
                  </h4>
                  <div className="space-y-4">
                    {related.map(p => (
                      <Link
                        key={p.slug}
                        to={`/blog/${p.slug}`}
                        className="group flex gap-3 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs font-semibold leading-snug group-hover:text-blue-700 transition-colors" style={{ color: 'var(--navy-deep)' }}>
                            {p.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{p.readTime} mnt</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
