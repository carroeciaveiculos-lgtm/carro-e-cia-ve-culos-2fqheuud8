import { supabase } from '@/lib/supabase/client'

export const getMarcas = async () => {
  const res = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas')
  return res.json()
}

export const getModelos = async (marcaId: string) => {
  const res = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos`)
  const data = await res.json()
  return data.modelos
}

export const getAnos = async (marcaId: string, modeloId: string) => {
  const res = await fetch(
    `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos`,
  )
  return res.json()
}

// ---------------------------------------------------------------------------
// API FIPE v2 (gratuita) — usada pela página pública /tabela-fipe.
// Consulta direto do navegador: a cota gratuita é por IP do visitante, então
// não consome a nossa. Não há proxy nem escrita no banco. Termos e limites em
// docs/tabela-fipe.md. As funções v1 acima seguem só para a home (Consignment).
// ---------------------------------------------------------------------------

const FIPE_V2 = 'https://fipe.parallelum.com.br/api/v2'
const CACHE_PREFIX = 'fipe-v2:'
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface FipeItem {
  code: string
  name: string
}

export interface FipeReferencia {
  code: string
  month: string
}

export interface FipePreco {
  price: string
  brand: string
  model: string
  modelYear: number
  fuel: string
  codeFipe: string
  referenceMonth: string
}

export const FIPE_ERRO_GENERICO =
  'Não conseguimos consultar a Tabela FIPE agora. Tente novamente em alguns minutos ou fale com a gente no WhatsApp.'

const lerCache = <T>(chave: string): T | null => {
  try {
    const bruto = localStorage.getItem(CACHE_PREFIX + chave)
    if (!bruto) return null
    const { t, v } = JSON.parse(bruto) as { t: number; v: T }
    return Date.now() - t < CACHE_TTL_MS ? v : null
  } catch {
    return null
  }
}

const gravarCache = (chave: string, valor: unknown) => {
  try {
    localStorage.setItem(CACHE_PREFIX + chave, JSON.stringify({ t: Date.now(), v: valor }))
  } catch {
    // cache é só conveniência — navegador privado/cheio não pode quebrar a página
  }
}

// Códigos da FIPE são numéricos (marca/modelo) ou "2014-3" (ano). Qualquer
// outra coisa nunca vira parte da URL.
const idValido = (valor: string) => /^[0-9]{1,8}(-[0-9])?$/.test(valor)
const mesValido = (valor: string) => /^[0-9]{1,5}$/.test(valor)

const buscarFipe = async <T>(
  caminho: string,
  cache?: string,
): Promise<{ data: T | null; error: string | null }> => {
  if (cache) {
    const guardado = lerCache<T>(cache)
    if (guardado) return { data: guardado, error: null }
  }
  try {
    const res = await fetch(`${FIPE_V2}${caminho}`, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) {
      return {
        data: null,
        error:
          res.status === 429
            ? 'Muitas consultas seguidas. Aguarde um pouco e tente de novo.'
            : FIPE_ERRO_GENERICO,
      }
    }
    const data = (await res.json()) as T
    if (cache) gravarCache(cache, data)
    return { data, error: null }
  } catch {
    return { data: null, error: FIPE_ERRO_GENERICO }
  }
}

// Mês de referência muda a cada 30 dias; guardamos a lista por poucas horas
// para a página perceber o mês novo logo, sem depender de cron.
export const getFipeReferencias = async () => {
  try {
    const bruto = localStorage.getItem(CACHE_PREFIX + 'refs')
    if (bruto) {
      const { t, v } = JSON.parse(bruto) as { t: number; v: FipeReferencia[] }
      if (Date.now() - t < 6 * 60 * 60 * 1000) return { data: v, error: null }
    }
  } catch {
    // segue para a rede
  }
  const r = await buscarFipe<FipeReferencia[]>('/references')
  if (r.data) gravarCache('refs', r.data)
  return r
}

export const getFipeMarcas = (ref: string) =>
  mesValido(ref)
    ? buscarFipe<FipeItem[]>(`/cars/brands?reference=${ref}`, `marcas:${ref}`)
    : Promise.resolve({ data: null, error: FIPE_ERRO_GENERICO })

export const getFipeModelos = (marca: string, ref: string) =>
  idValido(marca) && mesValido(ref)
    ? buscarFipe<FipeItem[]>(
        `/cars/brands/${marca}/models?reference=${ref}`,
        `modelos:${ref}:${marca}`,
      )
    : Promise.resolve({ data: null, error: FIPE_ERRO_GENERICO })

export const getFipeAnos = (marca: string, modelo: string, ref: string) =>
  idValido(marca) && idValido(modelo) && mesValido(ref)
    ? buscarFipe<FipeItem[]>(
        `/cars/brands/${marca}/models/${modelo}/years?reference=${ref}`,
        `anos:${ref}:${marca}:${modelo}`,
      )
    : Promise.resolve({ data: null, error: FIPE_ERRO_GENERICO })

export const getFipePreco = (marca: string, modelo: string, ano: string, ref: string) =>
  idValido(marca) && idValido(modelo) && idValido(ano) && mesValido(ref)
    ? buscarFipe<FipePreco>(
        `/cars/brands/${marca}/models/${modelo}/years/${ano}?reference=${ref}`,
        `preco:${ref}:${marca}:${modelo}:${ano}`,
      )
    : Promise.resolve({ data: null, error: FIPE_ERRO_GENERICO })

// "R$ 84.753,00" -> 84753
export const precoParaNumero = (preco: string) =>
  Number(preco.replace(/[^\d,]/g, '').replace(',', '.')) || 0

// Valores que a automação diária (fipe-atualizar-estoque) grava por veículo e mês.
// Substitui a leitura de fipe_anos, que nunca teve linhas.
export const getFipeHistoricoVeiculo = async (veiculoId: string) => {
  const { data, error } = await supabase
    .from('fipe_valores_veiculo')
    .select('referencia_mes, referencia_codigo, valor')
    .eq('veiculo_id', veiculoId)
    .eq('situacao', 'ok')
    .order('referencia_codigo', { ascending: true })
    .limit(36)
  return { data, error }
}
