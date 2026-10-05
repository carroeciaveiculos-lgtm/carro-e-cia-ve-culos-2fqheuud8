import { supabase } from '@/lib/supabase/client'

// Fotos com marca de IA (04/10/2026). O Galaxy AI (Samsung, "Photo assist") grava nas fotos editadas
// uma marca d'água visível "Conteúdo gerado por IA" e Credenciais de Conteúdo (C2PA). A detecção aqui
// olha só os metadados: foto editada, reenviada por WhatsApp (perde os metadados) e ainda com a marca
// d'água NÃO é detectada. As marcas NÃO são removidas: o caminho é usar fotos sem a marca ou as originais.
// (As tabelas novas ainda não estão em lib/supabase/types.ts; o cliente é tratado como genérico.)
const db = supabase as unknown as { from: (tabela: string) => any }

export const MIN_FOTOS_LIMPAS = 6

export type VeiculoFotos = {
  id: string
  placa: string | null
  marca: string | null
  modelo: string | null
  versao: string | null
  fotos: string[]
}

export type ResumoFotos = {
  veiculo: VeiculoFotos
  total: number
  limpas: number
  marcadas: number
  naoVerificadas: number
  urlsMarcadas: string[]
  situacao: 'apto' | 'precisa_fotos' | 'nao_verificado'
}

// Regra pura (testável): combina as fotos do cadastro com o cache de verificação
export function resumir(veiculo: VeiculoFotos, marcadaPorUrl: Map<string, boolean>): ResumoFotos {
  const fotos = Array.isArray(veiculo.fotos)
    ? veiculo.fotos.filter((u) => typeof u === 'string')
    : []
  let limpas = 0
  let marcadas = 0
  let naoVerificadas = 0
  const urlsMarcadas: string[] = []
  for (const u of fotos) {
    const m = marcadaPorUrl.get(u)
    if (m === undefined) naoVerificadas++
    else if (m) {
      marcadas++
      urlsMarcadas.push(u)
    } else limpas++
  }
  const situacao =
    naoVerificadas > 0 ? 'nao_verificado' : limpas >= MIN_FOTOS_LIMPAS ? 'apto' : 'precisa_fotos'
  return { veiculo, total: fotos.length, limpas, marcadas, naoVerificadas, urlsMarcadas, situacao }
}

export const listarAuditoria = async () => {
  const { data: veic, error } = await db
    .from('veiculos')
    .select('id, placa, marca, modelo, versao, fotos')
    .eq('status', 'disponivel')
    .order('placa', { ascending: true })
  if (error) return { data: [] as ResumoFotos[], error }
  const { data: cache } = await db.from('veiculo_fotos_ia').select('url, marcada').limit(5000)
  const mapa = new Map<string, boolean>(
    ((cache ?? []) as { url: string; marcada: boolean }[]).map((l) => [l.url, l.marcada]),
  )
  return { data: ((veic ?? []) as VeiculoFotos[]).map((v) => resumir(v, mapa)), error: null }
}

// Verifica um veículo (Edge Function auditar-fotos-ia). Devolve a frase de erro em português.
export const verificarVeiculo = async (
  veiculoId: string,
  forcar = false,
): Promise<{ erro: string | null }> => {
  const { data, error } = await supabase.functions.invoke('auditar-fotos-ia', {
    body: { veiculo_id: veiculoId, forcar },
  })
  if (error) {
    try {
      const corpo = await (error as { context?: Response }).context?.json()
      if (corpo?.error) return { erro: String(corpo.error) }
    } catch {
      /* usa a mensagem genérica abaixo */
    }
    return { erro: 'Não foi possível verificar as fotos. Tente de novo.' }
  }
  if (data?.error) return { erro: String(data.error) }
  return { erro: null }
}
