// Cores padrão do estoque — SEMPRE no masculino ("Preto", "Branco"), nunca
// "Preta"/"Branca" (regra da Adriana, 01/10/2026). Todas existem nos catálogos
// da Webmotors e da NaPista. Antes disso o campo era texto livre e o banco
// chegou a ter 10 grafias pra 7 cores (BRANCA, Branca, branco, PRETA...).
export const CORES_PADRAO = [
  'Branco',
  'Preto',
  'Prata',
  'Cinza',
  'Vermelho',
  'Azul',
  'Verde',
  'Amarelo',
  'Laranja',
  'Marrom',
  'Bege',
  'Dourado',
  'Vinho',
  'Bronze',
  'Rosa',
  'Roxo',
] as const

const semAcento = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()

// Grafia (sem acento, minúscula) -> cor padrão. Cobre feminino e variações
// que vêm da consulta de placa.
const GRAFIAS: Record<string, (typeof CORES_PADRAO)[number]> = {
  branco: 'Branco',
  branca: 'Branco',
  preto: 'Preto',
  preta: 'Preto',
  prata: 'Prata',
  prateado: 'Prata',
  prateada: 'Prata',
  cinza: 'Cinza',
  grafite: 'Cinza',
  chumbo: 'Cinza',
  vermelho: 'Vermelho',
  vermelha: 'Vermelho',
  azul: 'Azul',
  verde: 'Verde',
  amarelo: 'Amarelo',
  amarela: 'Amarelo',
  laranja: 'Laranja',
  marrom: 'Marrom',
  bege: 'Bege',
  dourado: 'Dourado',
  dourada: 'Dourado',
  vinho: 'Vinho',
  bronze: 'Bronze',
  rosa: 'Rosa',
  roxo: 'Roxo',
  roxa: 'Roxo',
}

// Devolve a cor padrão correspondente ou null se não reconhecer (ex.: "Perolizado").
export function normalizarCor(valor: string | null | undefined): string | null {
  if (!valor) return null
  return GRAFIAS[semAcento(valor)] ?? null
}
