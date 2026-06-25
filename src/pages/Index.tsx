import { SEO } from '@/components/SEO'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeInfo } from '@/components/home/HomeInfo'
import { HomeFeatures } from '@/components/home/HomeFeatures'
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
      'Vender seu carro nunca foi tão fácil. Consignação segura, profissional, com contrato protetor. Carro e Cia: referência 20+ anos em Uberaba.',
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
    pageData?.meta_title || 'Venda Seu Veículo em 48 Horas | Consignação Segura em Uberaba'
  const description =
    pageData?.meta_description ||
    'Venda seu carro em até 48 horas com consignação segura. Avaliação grátis, contrato protegido, transparência total.'
  const image =
    pageData?.imagem_destaque_url ||
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp'

  let blocks = []
  try {
    const parsed = JSON.parse(pageData?.conteudo || '{}')
    blocks = parsed.blocks || []
  } catch {
    /* intentionally ignored */
  }

  if (blocks.length === 0) {
    blocks = [
      { type: 'home-hero' },
      { type: 'home-info' },
      { type: 'home-features' },
      { type: 'home-social' },
      { type: 'home-faq' },
    ]
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO title={title} description={description} schema={schema} image={image} />
      {blocks.map((b: any, idx: number) => {
        if (b.type === 'home-hero') return <HomeHero key={idx} />
        if (b.type === 'home-info') return <HomeInfo key={idx} />
        if (b.type === 'home-features') return <HomeFeatures key={idx} />
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
