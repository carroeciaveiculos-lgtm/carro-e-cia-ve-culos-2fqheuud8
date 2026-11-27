import { supabase } from '@/lib/supabase/client'
import { camposVeiculosParaSelect } from '@/lib/exportar-estoque'
import { diasEmEstoque } from '@/lib/dias-estoque'

// Dados do relatório completo do estoque (26/11/2026). Junta a ficha do veículo com a última
// situação em cada portal, o contrato de consignação mais recente e a avaliação de entrada
// (ligada só pela placa — a tabela avaliacoes não guarda o id do veículo).
// `comProprietario = false` nem busca os campos do proprietário no banco.

const ROTULO_PUB: Record<string, string> = {
  publicado: 'Publicado',
  pending_create: 'Aguardando publicação',
  pending_update: 'Aguardando atualização',
  pending_delete: 'Aguardando remoção',
  despublicado: 'Despublicado',
  error: 'Erro',
  active: 'Ativo',
  blocked: 'Bloqueado',
  paused: 'Pausado',
  closed: 'Encerrado',
}

const normalizarPlaca = (p: string | null | undefined) =>
  (p || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

export const getEstoqueCompleto = async (veiculoIds: string[], comProprietario: boolean) => {
  if (!veiculoIds.length) return { data: [] as Record<string, unknown>[], error: null }

  const { data: veiculos, error } = await supabase
    .from('veiculos')
    .select(camposVeiculosParaSelect(comProprietario))
    .in('id', veiculoIds)
    .order('created_at', { ascending: true })
  if (error) return { data: null, error }

  const lista = (veiculos || []) as unknown as Record<string, any>[]
  const placas = [...new Set(lista.map((v) => v.placa).filter(Boolean))] as string[]

  const [pubs, ml, contratos, avaliacoes] = await Promise.all([
    supabase
      .from('estoque_publicacoes')
      .select('veiculo_id, platform, status, updated_at')
      .in('veiculo_id', veiculoIds)
      .order('updated_at', { ascending: false }),
    supabase
      .from('ml_listings')
      .select('veiculo_id, status, last_synced_at, created_at')
      .in('veiculo_id', veiculoIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('contratos_consignacao')
      .select(
        'veiculo_id, numero_contrato, tipo_documento, assinatura_status, assinatura_data, created_at',
      )
      .in('veiculo_id', veiculoIds)
      .order('created_at', { ascending: false }),
    placas.length
      ? supabase
          .from('avaliacoes')
          .select(
            'placa_veiculo, data_avaliacao, valor_avaliado, preco_consignacao, margem_esperada, condicao_geral, created_at',
          )
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])
  const erroExtra = pubs.error || ml.error || contratos.error || avaliacoes.error
  if (erroExtra) return { data: null, error: erroExtra }

  // As listas vêm da mais recente para a mais antiga: a primeira de cada chave é a atual.
  const ultimaPub = new Map<string, string>()
  for (const p of pubs.data || []) {
    const chave = `${p.veiculo_id}|${p.platform}`
    if (!ultimaPub.has(chave)) ultimaPub.set(chave, p.status || '')
  }
  const ultimoMl = new Map<string, string>()
  for (const m of ml.data || [])
    if (!ultimoMl.has(m.veiculo_id)) ultimoMl.set(m.veiculo_id, m.status || '')
  const ultimoContrato = new Map<string, any>()
  for (const ct of contratos.data || [])
    if (!ultimoContrato.has(ct.veiculo_id)) ultimoContrato.set(ct.veiculo_id, ct)
  const placasAlvo = new Set(placas.map(normalizarPlaca))
  const ultimaAvaliacao = new Map<string, any>()
  for (const a of (avaliacoes.data || []) as any[]) {
    const placa = normalizarPlaca(a.placa_veiculo)
    if (placa && placasAlvo.has(placa) && !ultimaAvaliacao.has(placa)) ultimaAvaliacao.set(placa, a)
  }

  const rotulo = (s?: string) => (s ? ROTULO_PUB[s] || s : 'Nunca enviado')

  const data = lista.map((v) => {
    const fotos = Array.isArray(v.fotos) ? v.fotos : []
    const videos = Array.isArray(v.videos) ? v.videos : []
    const ct = ultimoContrato.get(v.id)
    const av = ultimaAvaliacao.get(normalizarPlaca(v.placa))
    const { fotos: _f, videos: _v, ...resto } = v
    return {
      ...resto,
      qtd_fotos: fotos.length,
      foto_capa: fotos[0] || '',
      qtd_videos: videos.length,
      // Vendido: dias até a venda; vendido sem data de venda: vazio (src/lib/dias-estoque.ts).
      dias_em_estoque: diasEmEstoque(v) ?? '',
      pub_webmotors: rotulo(ultimaPub.get(`${v.id}|webmotors`)),
      pub_napista: rotulo(ultimaPub.get(`${v.id}|napista`)),
      pub_mercadolivre: rotulo(ultimoMl.get(v.id)),
      contrato_numero: ct?.numero_contrato ?? '',
      contrato_tipo: ct?.tipo_documento ?? '',
      contrato_assinatura_status: ct?.assinatura_status ?? '',
      contrato_assinatura_data: ct?.assinatura_data ?? '',
      avaliacao_data: av?.data_avaliacao ?? '',
      avaliacao_valor_avaliado: av?.valor_avaliado ?? '',
      avaliacao_preco_consignacao: av?.preco_consignacao ?? '',
      avaliacao_margem: av?.margem_esperada ?? '',
      avaliacao_condicao: av?.condicao_geral ?? '',
    } as Record<string, unknown>
  })

  return { data, error: null }
}

// Registro de quem exportou (sem nenhum dado de cliente): tabela access_log já existente.
export const registrarExportacaoEstoque = async (
  usuarioId: string | undefined,
  formato: 'csv' | 'xml',
  total: number,
  comProprietario: boolean,
) => {
  const { error } = await supabase.from('access_log').insert({
    usuario_id: usuarioId ?? null,
    modulo: 'relatorio_estoque',
    acao: `exportar_completo_${formato}: ${total} veiculos, ${comProprietario ? 'com' : 'sem'} dados do proprietario`,
  })
  return { error }
}
