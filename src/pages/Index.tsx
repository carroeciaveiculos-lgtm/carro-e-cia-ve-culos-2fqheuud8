import { Hero } from '@/components/home/Hero'
import { Consignment } from '@/components/home/Consignment'
import { StockAndFeatures } from '@/components/home/StockAndFeatures'
import { TestimonialsAndLocation } from '@/components/home/TestimonialsAndLocation'
import { SEO } from '@/components/SEO'

export default function Index() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Carro e Cia Veículos',
    image: 'https://carroeciaveiculos.goskip.app/logo.png',
    description: 'Loja de veículos usados com consignação de carros em Uberaba',
    url: 'https://carroeciaveiculos.goskip.app',
    telephone: '+55 34 99948-4285',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Guilherme Ferreira, 1119',
      addressLocality: 'Uberaba',
      addressRegion: 'MG',
      postalCode: '38022-200',
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '-19.768100',
      longitude: '-47.932688',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '18:00',
    },
    sameAs: [
      'https://www.facebook.com/carroeciaosmelhoresveiculos',
      'https://instagram.com/carroecia02',
    ],
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SEO
        title="Compre ou Consigne Carros em Uberaba | Carro e Cia Veículos"
        description="Carro e Cia Veículos - Compre ou consigne seu carro em Uberaba. Mais de 20 anos de confiança. Veículos de qualidade com procedência garantida."
        schema={schema}
      />
      <Hero />
      <Consignment />
      <StockAndFeatures />
      <TestimonialsAndLocation />
    </div>
  )
}
