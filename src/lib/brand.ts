export interface TeamMember {
  name: string
  role: string
  whatsapp: string
  whatsappDisplay: string
  email?: string
}

export interface BrandConfig {
  name: string
  whatsapp: string
  whatsappDisplay: string
  phone: string
  phoneDisplay: string
  email: string
  address: string
  addressDistrict: string
  addressCep: string
  city: string
  hoursWeek: string
  hoursSat: string
  instagram: string
  instagramUrl: string
  facebookUrl: string
  logoUrl: string
  team: TeamMember[]
}

export const DEFAULT_BRAND: BrandConfig = {
  name: 'Carro e Cia Veículos',
  whatsapp: '5534997384177',
  whatsappDisplay: '(34) 99738-4177',
  phone: '553433159400',
  phoneDisplay: '(34) 3315-9400',
  email: 'contato@carroeciamotors.com.br',
  address: 'Av. Guilherme Ferreira, 1119',
  addressDistrict: 'São Benedito',
  addressCep: '38022-200',
  city: 'Uberaba - MG',
  hoursWeek: 'Seg-Sex: 9h - 18h',
  hoursSat: 'Sáb: 9h - 14h',
  instagram: '@carroecia_uberaba',
  instagramUrl: 'https://instagram.com/carroecia_uberaba',
  facebookUrl: 'https://www.facebook.com/carroeciaosmelhoresveiculos',
  logoUrl: 'https://imagens.carroeciamotors.com.br/logos-e-imagens/logos/logo-carro-e-cia.webp',
  team: [
    {
      name: 'Luiz Fernando',
      role: 'CEO & Fundador',
      whatsapp: '5534984080000',
      whatsappDisplay: '(34) 98408-0000',
      email: 'luiz@carroeciamotors.com.br',
    },
    {
      name: 'Adriana Araújo',
      role: 'Seguros, Consórcios e Financiamentos',
      whatsapp: '5534984080220',
      whatsappDisplay: '(34) 98408-0220',
      email: 'adriana@carroeciamotors.com.br',
    },
    {
      name: 'Gabriel Araújo',
      role: 'Seguro Auto',
      whatsapp: '5534992000300',
      whatsappDisplay: '(34) 99200-0300',
      email: 'gabrielaraujo@kmzero.com.br',
    },
    {
      name: 'Roberto Junior',
      role: 'Vendas',
      whatsapp: '5534992893615',
      whatsappDisplay: '(34) 99289-3615',
      email: 'roberto@carroeciamotors.com.br',
    },
  ],
}

export const BRAND = DEFAULT_BRAND
