import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Veiculo = Database['public']['Tables']['veiculos']['Row']

export const getVeiculos = async () => {
  const { data, error } = await supabase
    .from('veiculos')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const getVeiculoById = async (id: string) => {
  const { data, error } = await supabase.from('veiculos').select('*').eq('id', id).single()
  return { data, error }
}

export const createVeiculo = async (
  veiculo: Database['public']['Tables']['veiculos']['Insert'],
) => {
  const { data, error } = await supabase.from('veiculos').insert([veiculo]).select().single()
  return { data, error }
}

export const getContratoByVeiculoId = async (veiculoId: string) => {
  const { data, error } = await supabase
    .from('contratos_consignacao')
    .select('*')
    .eq('veiculo_id', veiculoId)
    .maybeSingle()

  return { data, error }
}

export const getVeiculosWithoutPhotos = async () => {
  const { data, error } = await supabase
    .from('veiculos')
    .select('id, placa, marca, modelo')
    .or('fotos.is.null,fotos.eq.[]')
    .eq('status', 'disponivel')
  return { data, error }
}

// Exclusão segura de veículo (24/11/2026, pedido da Adriana).
// Antes, o botão "Excluir" apagava 9 tabelas uma por uma ANTES de tentar
// apagar o veículo; quando o último passo falhava (ex.: Audi PQE7D92 e Land
// Rover FJK7E17, barrados pela tabela de backup), documentos/despesas/
// contratos já tinham sumido. Agora: (1) se o veículo tem algo que não pode
// se perder, a exclusão é bloqueada e a tela sugere "Devolver"/"Vendido";
// (2) senão, apaga só o veículo numa operação única — o banco remove o
// resto em cascata ou desvincula (leads/notas fiscais), tudo ou nada.
export type BloqueioExclusao = { motivo: string; quantidade: number }

export const getBloqueiosExclusao = async (veiculoId: string) => {
  const consultas = await Promise.all([
    supabase
      .from('estoque_publicacoes')
      .select('id', { count: 'exact', head: true })
      .eq('veiculo_id', veiculoId)
      .neq('status', 'despublicado')
      // "error" sem código de anúncio nunca chegou ao portal: não bloqueia.
      .or('status.neq.error,post_id.not.is.null'),
    supabase
      .from('ml_listings')
      .select('id', { count: 'exact', head: true })
      .eq('veiculo_id', veiculoId)
      .neq('status', 'closed'),
    supabase
      .from('contratos_consignacao')
      .select('id', { count: 'exact', head: true })
      .eq('veiculo_id', veiculoId),
    supabase
      .from('consignacoes')
      .select('id', { count: 'exact', head: true })
      .eq('veiculo_id', veiculoId),
    supabase
      .from('documentos')
      .select('id', { count: 'exact', head: true })
      .eq('veiculo_id', veiculoId),
    supabase
      .from('despesas')
      .select('id', { count: 'exact', head: true })
      .eq('veiculo_id', veiculoId),
    supabase
      .from('agendamentos_visita')
      .select('id', { count: 'exact', head: true })
      .eq('veiculo_id', veiculoId),
  ])

  const motivos = [
    'anúncio ativo em portal (Webmotors/NaPista)',
    'anúncio no Mercado Livre não encerrado',
    'contrato de consignação',
    'consignação',
    'documento',
    'despesa',
    'agendamento de visita',
  ]

  const erro = consultas.find((c) => c.error)?.error ?? null
  if (erro) return { data: null, error: erro }

  const data: BloqueioExclusao[] = consultas
    .map((c, i) => ({ motivo: motivos[i], quantidade: c.count ?? 0 }))
    .filter((b) => b.quantidade > 0)

  return { data, error: null }
}

export const excluirVeiculo = async (veiculoId: string) => {
  const { error } = await supabase.from('veiculos').delete().eq('id', veiculoId)
  if (error) return { error }
  // logs_integracao não tem vínculo (FK) com veiculos: limpa só depois que a
  // exclusão deu certo. Falha aqui não desfaz nada importante, só deixa log órfão.
  await supabase.from('logs_integracao').delete().eq('veiculo_id', veiculoId)
  return { error: null }
}

const MAX_RETRIES = 2
const MIN_BATCH_SIZE = 1
const RESOURCE_LIMIT_STATUS = 546

export const triggerDriveSync = async (params?: { offset?: number; limit?: number }) => {
  const limit = Math.min(params?.limit ?? 2, 2)
  let currentLimit = limit
  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await supabase.functions.invoke('sync-google-drive', {
      body: { ...params, limit: currentLimit },
    })

    if (!error) {
      return { data, error: null }
    }

    const isResourceLimit =
      (error as any)?.context?.status === RESOURCE_LIMIT_STATUS ||
      (error as any)?.status === RESOURCE_LIMIT_STATUS ||
      String((error as any)?.message ?? '').includes('546') ||
      String((error as any)?.message ?? '')
        .toLowerCase()
        .includes('resource_limit')

    if (isResourceLimit && currentLimit > MIN_BATCH_SIZE) {
      currentLimit = MIN_BATCH_SIZE
      lastError = error
      continue
    }

    if (isResourceLimit) {
      console.warn('sync-google-drive: resource limit reached, stopping sync gracefully')
      return { data: null, error: null }
    }

    return { data, error }
  }

  console.warn('sync-google-drive: exhausted retries due to resource limits, stopping gracefully')
  return { data: null, error: null }
}
