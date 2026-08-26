import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export interface CommandContext {
  supabase: SupabaseClient
  supabaseUrl: string
  supabaseServiceKey: string
  waToken: string
  waPhoneId: string
  fromPhone: string
}

export async function handleEstoque(ctx: CommandContext): Promise<string> {
  const { data, error } = await ctx.supabase
    .from('veiculos')
    .select('marca, modelo, ano_modelo, cor, preco_venda, status')
    .eq('exibir_no_site', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error || !data || data.length === 0) return '❌ Nenhum veículo disponível no estoque.'

  const list = data
    .map(
      (v, i) =>
        `${i + 1}. *${v.marca} ${v.modelo}*\n   Ano: ${v.ano_modelo || 'N/A'} | Cor: ${v.cor || 'N/A'}\n   Preço: R$ ${(v.preco_venda || 0).toLocaleString('pt-BR')}\n   Status: ${v.status || 'N/A'}`,
    )
    .join('\n\n')

  return `🚗 *5 Veículos Mais Recentes:*\n\n${list}`
}

export async function handleBuscar(termo: string, ctx: CommandContext): Promise<string> {
  if (!termo) return '❌ Use: BUSCAR [termo]'

  const { data, error } = await ctx.supabase
    .from('veiculos')
    .select('marca, modelo, versao, ano_modelo, preco_venda, status')
    .or(`marca.ilike.%${termo}%,modelo.ilike.%${termo}%,versao.ilike.%${termo}%`)
    .eq('exibir_no_site', true)
    .limit(10)

  if (error || !data || data.length === 0) return `❌ Nenhum veículo encontrado para "${termo}".`

  // Versão removida da listagem (pedido da Adriana, 26/08/2026) — repetia
  // texto já presente em Modelo. Continua entrando na busca acima (.or) pra
  // não perder resultado por palavra-chave de versão, só não aparece mais
  // duplicado no texto mostrado.
  const list = data
    .map(
      (v, i) =>
        `${i + 1}. *${v.marca} ${v.modelo}*\n   Ano: ${v.ano_modelo || 'N/A'} | R$ ${(v.preco_venda || 0).toLocaleString('pt-BR')}`,
    )
    .join('\n\n')

  return `🔍 *Resultados para "${termo}":*\n\n${list}`
}

export async function handleVendido(termo: string, ctx: CommandContext): Promise<string> {
  if (!termo) return '❌ Use: VENDIDO [termo]'

  const { data: veiculo } = await ctx.supabase
    .from('veiculos')
    .select('id, marca, modelo')
    .or(`marca.ilike.%${termo}%,modelo.ilike.%${termo}%,versao.ilike.%${termo}%`)
    .eq('exibir_no_site', true)
    .maybeSingle()

  if (!veiculo) return `❌ Veículo não encontrado ou já vendido: "${termo}"`

  await ctx.supabase
    .from('veiculos')
    .update({ status: 'Vendido', exibir_no_site: false })
    .eq('id', veiculo.id)

  return `✅ Veículo marcado como *Vendido* e removido do site:\n\n*${veiculo.marca} ${veiculo.modelo}*`
}
