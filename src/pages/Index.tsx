import { SEO } from '@/components/SEO'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeInfo } from '@/components/home/HomeInfo'
import { HomeFeatures } from '@/components/home/HomeFeatures'
import { HomeSocial } from '@/components/home/HomeSocial'
import { HomeFaqContact } from '@/components/home/HomeFaqContact'

export default function Index() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Carro e Cia Veículos',
    image:
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp',
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO
        title="Consigne Seu Carro em Uberaba | Carro e Cia Veículos - 20+ Anos"
        description="Vender seu carro nunca foi tão fácil. Consignação segura, profissional, com contrato protetor. Carro e Cia: referência 20+ anos em Uberaba."
        schema={schema}
        image="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
      />
      <HomeHero />
      <HomeInfo />
      <HomeFeatures />
      <HomeSocial />
      <HomeFaqContact />
    </div>
  )
}
