import { supabase } from '@/lib/supabase/client'

export interface AvaliacaoVeiculo {
  id: string
  lead_id: string
  agendamento_id: string | null
  avaliador_id: string | null
  marca: string
  modelo: string
  ano_fabricacao: number | null
  ano_modelo: number | null
  placa: string | null
  quilometragem: number | null
  cor: string | null
  cambio: string | null
  combustivel: string | null
  estado_conservacao: string | null
  itens_opcionais: string[] | null
  tem_debito_multa_sinistro: boolean
  observacao_debito: string | null
  fotos: string[] | null
  valor_proposto: number | null
  observacoes: string | null
  destino: 'pendente' | 'proposta_enviada' | 'consignacao' | 'compra_estoque' | 'recusado'
  created_at: string
  updated_at: string
  leads?: { nome: string; telefone: string | null } | null
  veiculo_id_gerado?: string | null
}

export async function fetchAvaliacoes(): Promise<AvaliacaoVeiculo[]> {
  const { data, error } = await supabase
    .from('avaliacoes_veiculo')
    .select('*, leads(nome, telefone)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as unknown as AvaliacaoVeiculo[]
}

export async function fetchAvaliacao(id: string): Promise<AvaliacaoVeiculo | null> {
  const { data, error } = await supabase
    .from('avaliacoes_veiculo')
    .select('*, leads(nome, telefone)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as unknown as AvaliacaoVeiculo | null
}

export async function fetchAgendamentosAvaliacaoPendentes() {
  const { data, error } = await supabase
    .from('agendamentos_visita')
    .select('id, data_hora, lead_id, leads(nome, telefone)')
    .eq('tipo', 'avaliacao')
    .in('status', ['agendado'])
    .order('data_hora', { ascending: false })
  if (error) throw error
  return data || []
}

export async function buscarLeadsPorNomeOuTelefone(termo: string) {
  const { data, error } = await supabase
    .from('leads')
    .select('id, nome, telefone')
    .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%`)
    .limit(10)
  if (error) throw error
  return data || []
}

export async function criarLeadAvulso(nome: string, telefone: string) {
  const { data, error } = await supabase
    .from('leads')
    .insert({ nome, telefone, origem: 'avaliacao_avulsa', tipo: 'vendedor', status: 'novo' })
    .select('id, nome, telefone')
    .single()
  if (error) throw error
  return data
}

export type NovaAvaliacaoInput = Omit<
  AvaliacaoVeiculo,
  'id' | 'created_at' | 'updated_at' | 'destino' | 'leads' | 'veiculo_id_gerado'
>

export async function createAvaliacao(input: NovaAvaliacaoInput): Promise<AvaliacaoVeiculo> {
  const { data, error } = await supabase
    .from('avaliacoes_veiculo')
    .insert(input)
    .select('*, leads(nome, telefone)')
    .single()
  if (error) throw error
  return data as unknown as AvaliacaoVeiculo
}

export async function marcarRecusado(id: string): Promise<void> {
  const { error } = await supabase
    .from('avaliacoes_veiculo')
    .update({ destino: 'recusado', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function gerarPropostaAvaliacao(id: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('gerar-pdf-avaliacao', {
    body: { avaliacao_id: id },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data.url as string
}

// "Marcar como consignação" / "Marcar como compra (estoque)" (plano
// 17/08/2026): as duas convergem pra mesma necessidade — o carro avaliado
// precisa virar um cadastro real em `veiculos` (status 'rascunho', o
// vendedor completa o resto: fotos de anúncio, preço, descrição). A
// diferença é só se grava dados de proprietário (consignação, o cliente
// continua dono) ou não (compra, a loja é dona). Reaproveita o cadastro
// que já existe em /admin/estoque (VehicleFormModal já sabe editar por
// vehicleId) em vez de duplicar formulário.
export async function marcarConsignacaoOuCompra(
  avaliacao: AvaliacaoVeiculo,
  destino: 'consignacao' | 'compra_estoque',
): Promise<string> {
  if (!avaliacao.placa) {
    throw new Error('Preencha a placa na avaliação antes de gerar o cadastro do veículo.')
  }

  const veiculoData: Record<string, any> = {
    marca: avaliacao.marca,
    modelo: avaliacao.modelo,
    ano_fabricacao: avaliacao.ano_fabricacao,
    ano_modelo: avaliacao.ano_modelo,
    placa: avaliacao.placa,
    quilometragem: avaliacao.quilometragem,
    cor: avaliacao.cor,
    cambio: avaliacao.cambio,
    combustivel: avaliacao.combustivel,
    fotos: avaliacao.fotos || [],
    status: 'rascunho',
  }

  if (destino === 'consignacao') {
    veiculoData.proprietario_nome = avaliacao.leads?.nome || null
    veiculoData.proprietario_telefone = avaliacao.leads?.telefone || null
  } else {
    veiculoData.preco_venda = avaliacao.valor_proposto
  }

  const { data: veiculo, error } = await supabase
    .from('veiculos')
    .insert(veiculoData)
    .select('id')
    .single()
  if (error) throw error

  const { error: updError } = await supabase
    .from('avaliacoes_veiculo')
    .update({ destino, updated_at: new Date().toISOString() })
    .eq('id', avaliacao.id)
  if (updError) throw updError

  return veiculo.id as string
}
