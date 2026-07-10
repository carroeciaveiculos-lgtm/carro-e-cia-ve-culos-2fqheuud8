import { useEffect } from 'react'

interface SEOProps {
  title: string
  description: string
  schema?: object
  canonical?: string
  image?: string
  type?: string
  noindex?: boolean
  keywords?: string
  ogTitle?: string
  ogDescription?: string
}

export function SEO({ title, description, schema, noindex = false, keywords }: SEOProps) {
  useEffect(() => {
    document.title = title

    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', description)

    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Carro e Cia Veículos',
      url: 'https://www.carroeciamotors.com.br',
      logo: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia.webp',
      telephone: '+5534999484285',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Guilherme Ferreira, 1119',
        addressLocality: 'Uberaba',
        addressRegion: 'MG',
        postalCode: '38022-200',
        addressCountry: 'BR',
      },
      sameAs: ['https://www.instagram.com/carroeciaveiculos', 'https://wa.me/5534999484285'],
    }

    const scripts: HTMLScriptElement[] = []

    let orgScript = document.querySelector('script#schema-org') as HTMLScriptElement
    if (!orgScript) {
      orgScript = document.createElement('script')
      orgScript.type = 'application/ld+json'
      orgScript.id = 'schema-org'
      orgScript.text = JSON.stringify(organizationSchema)
      document.head.appendChild(orgScript)
    }

    let script: HTMLScriptElement | null = null
    if (schema) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(schema)
      document.head.appendChild(script)
      scripts.push(script)
    }

    const isPreviewEnv =
      typeof window !== 'undefined' && window.location.hostname.includes('goskip.app')
    let metaRobots = document.querySelector('meta[name="robots"]')
    if (!metaRobots) {
      metaRobots = document.createElement('meta')
      metaRobots.setAttribute('name', 'robots')
      document.head.appendChild(metaRobots)
    }
    metaRobots.setAttribute(
      'content',
      noindex || isPreviewEnv
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    )

    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', keywords)
    }

    let linkSitemap = document.querySelector('link[rel="sitemap"]')
    if (!linkSitemap) {
      linkSitemap = document.createElement('link')
      linkSitemap.setAttribute('rel', 'sitemap')
      linkSitemap.setAttribute('type', 'application/xml')
      linkSitemap.setAttribute('title', 'Sitemap')
      linkSitemap.setAttribute('href', '/sitemap.xml')
      document.head.appendChild(linkSitemap)
    }

    return () => {
      if (script && document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [title, description, schema, noindex, keywords])

  return null
}
