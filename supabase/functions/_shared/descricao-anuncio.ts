// Regras de descrição de anúncio compartilhadas entre as integrações
// (decisão da Adriana, 30/09/2026):
// - Mercado Livre e NaPista: no máximo 800 caracteres.
// - Webmotors: no máximo 500 (acima disso a página pública esconde a
//   descrição inteira, mesmo com a API respondendo sucesso).
// - Toda descrição termina com a mesma frase fixa, em todas as plataformas.
//
// A frase mora em ai_prompts_config (slug abaixo, coluna rodape_fixo) pra ela
// editar pela tela; a constante é só reserva caso a linha do banco sumir.

export const SLUG_FRASE_FINAL = 'vehicle_description_webmotors'

export const FRASE_FINAL_PADRAO =
  'Reservamo-nos o direito de corrigir eventuais erros de digitação; valores sujeitos a alteração sem aviso prévio.'

export const LIMITE_DESCRICAO_PORTAIS = 800
export const LIMITE_DESCRICAO_WEBMOTORS = 500

// Parágrafo institucional que até 30/09/2026 era colado em toda descrição e
// enviado sozinho à Webmotors. Continua aqui por dois motivos: é o texto da
// Webmotors enquanto o veículo não tem descrição própria, e serve pra remover
// o parágrafo das descrições antigas (o teto de 800 não deixaria espaço pro
// texto do carro se ele continuasse lá).
export const PARAGRAFO_INSTITUCIONAL_LEGADO =
  'Há mais de 25 anos no mercado, a Carro & Cia Veículos trabalha com 0 km e seminovos com laudo cautelar aprovado, qualidade e procedência garantidas. Atendimento personalizado, preço justo, pronta entrega, melhor avaliação na troca, financiamento em até 60 vezes com aprovação imediata, seguro auto e consórcios. Consulte nossos vendedores sobre versões, modelos, pintura e frete. Reservamo-nos o direito de corrigir eventuais erros de digitação; valores sujeitos a alteração sem aviso prévio.'

let cacheFrase: { frase: string; ate: number } | null = null

// Uma consulta por minuto no máximo, pros crons que sincronizam vários
// veículos em sequência não baterem no banco a cada item.
export async function buscarFraseFinal(supabase: any): Promise<string> {
  if (cacheFrase && cacheFrase.ate > Date.now()) return cacheFrase.frase
  let frase = FRASE_FINAL_PADRAO
  try {
    const { data } = await supabase
      .from('ai_prompts_config')
      .select('rodape_fixo')
      .eq('slug', SLUG_FRASE_FINAL)
      .maybeSingle()
    if (data?.rodape_fixo && data.rodape_fixo.trim()) frase = data.rodape_fixo.trim()
  } catch {
    // Sem banco, usa a frase padrão — nunca deixa o anúncio sem ela.
  }
  cacheFrase = { frase, ate: Date.now() + 60_000 }
  return frase
}

// Corta só o texto do carro, em espaço (nunca no meio da palavra), pra caber
// em `orcamento` caracteres contando as reticências.
export function cortarCorpo(corpo: string, orcamento: number): string {
  const limpo = (corpo || '').trim()
  if (orcamento <= 0) return ''
  if (limpo.length <= orcamento) return limpo
  const corte = Math.max(orcamento - 3, 0)
  let fatia = limpo.slice(0, corte)
  if (/\S/.test(limpo.charAt(corte))) fatia = fatia.replace(/\s+\S*$/, '')
  return fatia.replace(/[\s,;:.\-–]+$/, '') + '...'
}

// Devolve `corpo + separador + frase` com no máximo `limite` caracteres.
// A frase nunca é cortada: se faltar espaço, quem encolhe é o texto do carro.
export function montarDescricao(
  texto: string,
  limite: number,
  frase: string,
  separador = '\n\n',
): string {
  let corpo = (texto || '').split(PARAGRAFO_INSTITUCIONAL_LEGADO).join('')
  // Tira a frase do final (a atual e a padrão) pra nunca duplicar.
  for (const f of new Set([frase, FRASE_FINAL_PADRAO])) {
    corpo = corpo.trim()
    while (f && corpo.endsWith(f)) corpo = corpo.slice(0, -f.length).trim()
  }
  corpo = cortarCorpo(corpo, limite - frase.length - separador.length)
  return corpo ? `${corpo}${separador}${frase}` : frase
}
