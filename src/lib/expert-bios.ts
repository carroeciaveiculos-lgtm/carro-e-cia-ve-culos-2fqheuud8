export interface ExpertBio {
  name: string
  role: string
  bio: string
  fotoUrl: string
  especialidade: string
}

const EXPERT_BIOS: Record<string, ExpertBio> = {
  'Adriana Araújo': {
    name: 'Adriana Araújo',
    role: 'Especialista em Financiamento e Consórcios',
    bio: 'Com mais de 20 anos de experiência no mercado automotivo de Uberaba, Adriana é referência em financiamento veicular, consórcios e soluções de crédito para compra de veículos. Sua especialidade é encontrar a melhor condição financeira para cada perfil de cliente, sempre com transparência e atendimento personalizado.',
    fotoUrl:
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/adriana%20na%20mesa.jpeg',
    especialidade: 'Financiamento, Consórcios e Seguros',
  },
  'Gabriel Araújo': {
    name: 'Gabriel Araújo',
    role: 'Especialista em Seguro Auto',
    bio: 'Gabriel é especialista em seguros automotivos, ajudando clientes a encontrar as melhores coberturas com o melhor custo-benefício. Com profundo conhecimento das seguradoras do mercado, ele garante proteção total para seu veículo com atendimento dedicado e suporte completo em sinistros.',
    fotoUrl:
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/gabriel%20na%20mesa.jpeg',
    especialidade: 'Seguro Auto',
  },
}

export function getExpertBio(authorName?: string | null): ExpertBio | null {
  if (!authorName) return null
  if (EXPERT_BIOS[authorName]) return EXPERT_BIOS[authorName]
  const key = Object.keys(EXPERT_BIOS).find((k) => k.toLowerCase() === authorName.toLowerCase())
  return key ? EXPERT_BIOS[key] : null
}
