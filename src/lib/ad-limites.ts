// Canais, tipos de anúncio e limites de caracteres do Criador de Anúncios.
//
// ATENÇÃO: os limites abaixo são conhecimento geral das plataformas (05/11/2026) e AINDA
// NÃO foram conferidos na documentação oficial — conferir antes de tratar como definitivos.
// A Edge Function `ad-copy-generator` tem uma cópia destes números (ela roda em Deno e não
// importa de `src/`). Se mudar aqui, mude lá também.

export type CanalAnuncio = 'meta' | 'google' | 'organico'
export type TipoAnuncio = 'estatico' | 'carrossel' | 'video'

export const CANAIS: { valor: CanalAnuncio; nome: string; descricao: string }[] = [
  { valor: 'meta', nome: 'Meta Ads', descricao: 'Facebook e Instagram (anúncio pago)' },
  { valor: 'google', nome: 'Google Ads', descricao: 'Anúncio de pesquisa (só texto)' },
  { valor: 'organico', nome: 'Orgânico', descricao: 'Legenda de post, sem pagar' },
]

export const TIPOS_ANUNCIO: { valor: TipoAnuncio; nome: string; descricao: string }[] = [
  { valor: 'estatico', nome: 'Estático', descricao: 'Uma imagem no Padrão Carro e Cia' },
  { valor: 'carrossel', nome: 'Carrossel', descricao: 'Até 8 fotos do veículo' },
  { valor: 'video', nome: 'Vídeo', descricao: 'Um vídeo já cadastrado do veículo' },
]

export const TONS_DE_VOZ = ['Profissional', 'Amigável', 'Urgente', 'Premium', 'Direto'] as const

export const LIMITES = {
  meta: { textoPrincipal: 125, titulo: 40, descricao: 30, tituloCartao: 40 },
  google: { titulo: 30, descricao: 90 },
  organico: { legenda: 2200 },
} as const

// Carrossel: o Meta aceita de 2 a 10 cartões; aqui o mínimo é 3 e o máximo 8 (pedido da
// Adriana em 05/11/2026). O mínimo é uma proposta, ainda a confirmar com ela.
export const MIN_FOTOS_CARROSSEL = 3
export const MAX_FOTOS_CARROSSEL = 8

// O Google (pesquisa) não usa imagem nem vídeo do veículo: o tipo não se aplica.
export const tipoSeAplica = (canal: CanalAnuncio) => canal !== 'google'
