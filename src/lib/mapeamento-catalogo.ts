export type PlataformaMapeavel = 'webmotors' | 'napista'

// Mensagens que wm-sync e napista-sync gravam quando bloqueiam a publicação
// por falta de mapeamento de catálogo — "Veículo sem mapeamento de catálogo
// Webmotors confirmado (...)" / "... NaPista confirmado (...)".
export function isErroMapeamento(mensagem: string | null | undefined): boolean {
  return /sem mapeamento de cat[aá]logo/i.test(mensagem || '')
}

export function isPlataformaMapeavel(slug: string | null | undefined): slug is PlataformaMapeavel {
  return slug === 'webmotors' || slug === 'napista'
}

export const NOME_PLATAFORMA_MAPEAVEL: Record<PlataformaMapeavel, string> = {
  webmotors: 'Webmotors',
  napista: 'NaPista',
}
