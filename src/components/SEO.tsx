import { useEffect } from 'react'
import { getImageUrl } from '@/lib/image-utils'

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
  isVehicle?: boolean
}

export function SEO({
  title,
  description,
  schema,
  noindex = false,
  keywords,
  image,
  isVehicle = false,
}: SEOProps) {
  useEffect(() => {
    document.title = title

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name'
      let tag = document.querySelector(`meta[${attr}="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    setMeta('description', description)

    if (!isVehicle) {
      setMeta('og:title', title, true)
      setMeta('og:description', description, true)
      setMeta('og:type', 'website', true)

      let finalImage = image
        ? getImageUrl(image)
        : 'https://www.carroeciamotors.com.br/og-image.jpeg'
      if (finalImage.startsWith('/')) {
        finalImage = `https://www.carroeciamotors.com.br${finalImage}`
      }
      setMeta('og:image', finalImage, true)
      setMeta('og:url', window.location.href, true)
    } else {
      const ogTags = document.querySelectorAll('meta[property^="og:"]')
      ogTags.forEach((tag) => tag.remove())
    }

    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Carro e Cia Veículos',
      url: 'https://www.carroeciamotors.com.br',
      logo: 'https://imagens.carroeciamotors.com.br/logos-e-imagens/logos/logo-carro-e-cia.webp',
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
      setMeta('keywords', keywords)
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
  }, [title, description, schema, noindex, keywords, image, isVehicle])

  return null
}
