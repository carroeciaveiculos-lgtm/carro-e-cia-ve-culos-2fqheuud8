import { useEffect } from 'react'
import { getImageUrl } from '@/lib/image-utils'
import { useBrandConfig } from '@/hooks/use-brand-config'

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
  // Endereço/telefone/logo saíram do hardcode em 17/08/2026 — passam a vir
  // de brand_config (mesma fonte que o rodapé já usa via useBrandConfig),
  // editável em /admin/configuracoes, aba "Loja & SEO". `config` já nasce
  // com DEFAULT_BRAND (mesmos valores que estavam hardcoded aqui antes),
  // então não tem risco de schema vazio antes do fetch terminar.
  const { config: brand } = useBrandConfig()

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

    const [addressLocality, addressRegion] = brand.city.split(' - ').map((s) => s.trim())

    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name: brand.name,
      legalName: 'Transluga Administração de Veículos LTDA',
      taxID: '10.196.974/0001-46',
      url: 'https://www.carroeciamotors.com.br',
      logo: brand.logoUrl,
      image: brand.logoUrl,
      telephone: `+${brand.phone}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: brand.address,
        addressLocality: addressLocality || 'Uberaba',
        addressRegion: addressRegion || 'MG',
        postalCode: brand.addressCep,
        addressCountry: 'BR',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '08:00',
          closes: '18:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Saturday'],
          opens: '08:00',
          closes: '13:00',
        },
      ],
      sameAs: ['https://www.instagram.com/carroeciaveiculos', 'https://wa.me/5534997384177'],
    }

    const scripts: HTMLScriptElement[] = []

    let orgScript = document.querySelector('script#schema-org') as HTMLScriptElement
    if (orgScript) {
      orgScript.text = JSON.stringify(organizationSchema)
    } else {
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
  }, [title, description, schema, noindex, keywords, image, isVehicle, brand])

  return null
}
