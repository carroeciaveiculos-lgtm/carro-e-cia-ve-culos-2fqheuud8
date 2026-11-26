// Campo "Lugares" do cadastro (26/11/2026, plano docs/cadastro-busca-fipe.md, Parte 2).
// Caso real: duas Hilux SW4 de 7 lugares anunciadas na Webmotors como 5 lugares.
// A MESMA regra existe em supabase/functions/wm-mapear-veiculo/index.ts (a function não importa
// de src/) — ao mudar aqui, mudar lá também.

export const OPCOES_LUGARES = [2, 4, 5, 6, 7, 8, 9] as const

// Textos reais vistos: placa/FIPE "SRX 4x4 7 Lug. 2.8", Webmotors "SRX 4X4 7 LUGARES" e "SRX 7L 4X4".
// O "7" não pode vir depois de dígito, ponto ou vírgula: "2.7 SRV" e "2.7L" são motor, não lugares.
const SETE_LUGARES = /(?<![\d.,])7\s*(?:lugares|lug\b\.?|l\b)/i

export function textoIndicaSeteLugares(texto: string | null | undefined): boolean {
  return SETE_LUGARES.test(texto || '')
}
