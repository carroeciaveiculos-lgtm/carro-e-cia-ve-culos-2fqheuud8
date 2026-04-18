import { useEffect } from 'react'

interface SEOProps {
  title: string
  description: string
  schema?: object
  canonical?: string
  image?: string
  type?: string
}

export function SEO({
  title,
  description,
  schema,
  canonical,
  image = 'https://img.usecurling.com/p/1200/630?q=car%20dealership',
  type = 'website',
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

    // Injeta o Schema Markup (JSON-LD)
    let script: HTMLScriptElement | null = null
    if (schema) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(schema)
      document.head.appendChild(script)
    }

    // Adiciona ou atualiza a tag Canonical
    const canonicalUrl = canonical || window.location.href.split('?')[0]
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
      { property: 'og:type', content: type },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ]

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

    // Cleanup para remover o schema e limpar ao trocar de página
    return () => {
      if (script && document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [title, description, schema, canonical])

  return null
}
