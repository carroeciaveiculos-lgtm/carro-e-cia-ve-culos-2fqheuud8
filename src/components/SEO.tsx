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
}

export function SEO({
  title,
  description,
  schema,
  canonical,
  image = 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp',
  type = 'website',
  noindex = false,
  keywords,
}: SEOProps) {
  useEffect(() => {
    // Atualiza o título da página
    document.title = title

    // Atualiza ou cria a meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', description)

    // Organization Schema (Global)
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Carro e Cia Veículos',
      url: 'https://carroeciamotors.com.br',
      logo: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp',
      telephone: '+5534999484285',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Guilherme Ferreira, 1119',
        addressLocality: 'Uberaba',
        addressRegion: 'MG',
        postalCode: '38010-200',
        addressCountry: 'BR',
      },
      sameAs: ['https://www.instagram.com/carroeciaveiculos', 'https://wa.me/5534999484285'],
    }

    const scripts: HTMLScriptElement[] = []

    // Check if org schema is already there
    let orgScript = document.querySelector('script#schema-org') as HTMLScriptElement
    if (!orgScript) {
      orgScript = document.createElement('script')
      orgScript.type = 'application/ld+json'
      orgScript.id = 'schema-org'
      orgScript.text = JSON.stringify(organizationSchema)
      document.head.appendChild(orgScript)
    }

    // Injeta o Schema Markup (JSON-LD) da página
    let script: HTMLScriptElement | null = null
    if (schema) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(schema)
      document.head.appendChild(script)
      scripts.push(script)
    }

    // Adiciona ou atualiza a tag Canonical - Força o domínio oficial sempre sem www e sem goskip
    let canonicalUrl = canonical || window.location.href.split('?')[0]
    try {
      const urlObj = new URL(canonicalUrl, 'https://carroeciamotors.com.br')
      urlObj.hostname = 'carroeciamotors.com.br'
      urlObj.protocol = 'https:'
      if (urlObj.port) urlObj.port = ''
      canonicalUrl = urlObj.toString()
      if (canonicalUrl !== 'https://carroeciamotors.com.br/' && canonicalUrl.endsWith('/')) {
        canonicalUrl = canonicalUrl.slice(0, -1)
      }
    } catch (e) {
      // fallback caso a URL seja inválida
      canonicalUrl = 'https://carroeciamotors.com.br'
    }
    let linkCanonical = document.querySelector('link[rel="canonical"]')
    if (!linkCanonical) {
      linkCanonical = document.createElement('link')
      linkCanonical.setAttribute('rel', 'canonical')
      document.head.appendChild(linkCanonical)
    }
    linkCanonical.setAttribute('href', canonicalUrl)

    // Open Graph Tags (Social Sharing Otimizado)
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:type', content: type },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ]

    if (keywords) {
      ogTags.push({ name: 'keywords', content: keywords } as any)
    }

    ogTags.forEach((tag) => {
      const selector = tag.property
        ? `meta[property="${tag.property}"]`
        : `meta[name="${tag.name}"]`
      let element = document.querySelector(selector)
      if (!element) {
        element = document.createElement('meta')
        if (tag.property) element.setAttribute('property', tag.property)
        if (tag.name) element.setAttribute('name', tag.name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', tag.content)
    })

    // Adiciona ou atualiza meta robots (noindex) e otimização de snippet
    let metaRobots = document.querySelector('meta[name="robots"]')
    if (!metaRobots) {
      metaRobots = document.createElement('meta')
      metaRobots.setAttribute('name', 'robots')
      document.head.appendChild(metaRobots)
    }
    metaRobots.setAttribute(
      'content',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    )

    // Cleanup para remover o schema e limpar ao trocar de página
    return () => {
      if (script && document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [title, description, schema, canonical, image, type, noindex])

  return null
}
