import { useEffect } from 'react'

type MetaOptions = {
  title: string
  description?: string
  canonical?: string
  ogImage?: string
}

const BASE = 'Solusi Dana Sahabat'
const BASE_DESC = 'Solusi Dana Sahabat – Layanan pinjaman dana dengan jaminan BPKB motor dan mobil, tersedia di seluruh Indonesia melalui mitra leasing terpercaya.'

export function useMeta({ title, description, canonical, ogImage }: MetaOptions) {
  useEffect(() => {
    const fullTitle = title === BASE ? BASE : `${title} | ${BASE}`
    document.title = fullTitle

    setMeta('description', description || BASE_DESC)
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', description || BASE_DESC, 'property')
    if (ogImage) setMeta('og:image', ogImage, 'property')

    const canon = canonical || window.location.href
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canon

    return () => {
      document.title = `${BASE} – Pinjaman Dana Jaminan BPKB Motor & Mobil`
    }
  }, [title, description, canonical, ogImage])
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
