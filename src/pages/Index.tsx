import { SEO } from '@/components/SEO'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeInfo } from '@/components/home/HomeInfo'
import { HomeFeatures } from '@/components/home/HomeFeatures'
import { Partners } from '@/components/home/Partners'
import { HomeSocial } from '@/components/home/HomeSocial'
import { HomeFaqContact } from '@/components/home/HomeFaqContact'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Index() {
  const [pageData, setPageData] = useState<any>(null)

  useEffect(() => {
    supabase
      .from('pages')
      .select('*')
      .eq('slug', '/')
      .eq('status_publicacao', 'Publicado')
      .single()
      .then(({ data }) => {
        if (data) {
          setPageData(data)
          supabase.rpc('increment_page_view', { p_slug: '/' })
        }
      })
  }, [])

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Carro e Cia Veículos',
    image:
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia.webp',
    description:
      'Venda seu carro rápido e seguro. Compra, venda e consignação de veículos com transparência total. Carro e Cia Veículos: referência 20+ anos em Uberaba.',
    url: 'https://carroeciamotors.com.br',
    telephone: '+55 34 99948-4285',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Guilherme Ferreira, 1119',
      addressLocality: 'Uberaba',
      addressRegion: 'MG',
      postalCode: '38022-200',
      addressCountry: 'BR',
    },
  }

  const title =
    pageData?.meta_title ||
    'Carro e Cia Veículos | Compra, Venda e Consignação de Veículos em Uberaba - MG'
  const description =
    pageData?.meta_description ||
    'Venda seu carro rápido e seguro. Encontre os melhores carros seminovos e usados selecionados com 1 ano de garantia e laudo cautelar aprovado em Uberaba - MG.'
  const image = pageData?.imagem_destaque_url || 'https://www.carroeciamotors.com.br/og-image.jpeg'

  const defaultBlocks = [
    { type: 'home-hero' },
    { type: 'home-info' },
    { type: 'home-features' },
    { type: 'partners' },
    { type: 'home-social' },
    { type: 'home-faq' },
  ]

  let blocks: { type: string; data?: any }[] = []
  try {
    const parsed = JSON.parse(pageData?.conteudo || '{}')
    blocks = parsed.blocks || []
  } catch {
    /* intentionally ignored */
  }

  if (blocks.length === 0) {
    blocks = defaultBlocks
  } else {
    const dbBlockTypes = new Set(blocks.map((b) => b.type))
    for (const def of defaultBlocks) {
      if (!dbBlockTypes.has(def.type)) {
        blocks.push(def)
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO title={title} description={description} schema={schema} image={image} />
      <h1 className="sr-only">Carro e Cia Motors | Revenda de Carros Seminovos em Uberaba - MG</h1>
      {blocks.map((b: any, idx: number) => {
        if (b.type === 'home-hero') return <HomeHero key={idx} />
        if (b.type === 'home-info') return <HomeInfo key={idx} />
        if (b.type === 'home-features') return <HomeFeatures key={idx} />
        if (b.type === 'partners') return <Partners key={idx} />
        if (b.type === 'home-social') return <HomeSocial key={idx} />
        if (b.type === 'home-faq') return <HomeFaqContact key={idx} />
        if (b.type === 'hero')
          return (
            <section key={idx} className="py-20 text-center text-4xl font-bold bg-muted">
              {b.data.title}
            </section>
          )
        if (b.type === 'text')
          return (
            <div
              key={idx}
              dangerouslySetInnerHTML={{ __html: b.data.html }}
              className="prose mx-auto py-10 px-4"
            />
          )
        return null
      })}
    </div>
  )
}
