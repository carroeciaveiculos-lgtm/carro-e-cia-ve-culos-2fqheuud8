import { useEffect } from 'react'

interface SEOProps {
  title: string
  description: string
  schema?: object
}

export function SEO({ title, description, schema }: SEOProps) {
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

    // Cleanup para remover o schema e limpar ao trocar de página
    return () => {
      if (script && document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [title, description, schema])

  return null
}
