import { createClient } from 'jsr:@supabase/supabase-js@2'
import { VALIDADE_MINUTOS, type Preparo } from './whatsapp-confirmacao.ts'

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
  const busca = termoSeguro(termo)
  if (!busca) return '❌ Use: BUSCAR [termo]'

  const { data, error } = await ctx.supabase
    .from('veiculos')
    .select('marca, modelo, versao, ano_modelo, preco_venda, status')
    .or(`marca.ilike.%${busca}%,modelo.ilike.%${busca}%,versao.ilike.%${busca}%`)
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

// Tira virgula/parenteses/percentual do termo: eles quebram a sintaxe do
// filtro .or() do PostgREST (e abririam brecha pra filtro injetado).
function termoSeguro(termo: string): string {
  return termo
    .replace(/[,()%*\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// PREPARA (nao altera nada): acha o veiculo e pergunta SIM/NAO.
export async function prepararVendido(termo: string, ctx: CommandContext): Promise<Preparo> {
  const busca = termoSeguro(termo)
  if (!busca) return { resposta: '❌ Use: VENDIDO [termo]' }

  const { data, error } = await ctx.supabase
    .from('veiculos')
    .select('id, marca, modelo, versao, ano_modelo, placa')
    .or(`marca.ilike.%${busca}%,modelo.ilike.%${busca}%,versao.ilike.%${busca}%`)
    .eq('exibir_no_site', true)
    .limit(6)

  if (error) return { resposta: '❌ Erro ao buscar o veículo. Tente de novo.' }
  if (!data || data.length === 0)
    return { resposta: `❌ Veículo não encontrado ou já vendido: "${termo}"` }
  if (data.length > 1) {
    const linhas = data
      .map(
        (v, i) =>
          `${i + 1}. ${v.marca} ${v.modelo}${v.ano_modelo ? ` ${v.ano_modelo}` : ''}${v.placa ? ` (${v.placa})` : ''}`,
      )
      .join('\n')
    return {
      resposta: `⚠️ Mais de um veículo bate com "${termo}". Especifique melhor (marca + modelo + ano, ou a placa):\n\n${linhas}`,
    }
  }

  const v = data[0]
  const nome = `${v.marca} ${v.modelo}${v.ano_modelo ? ` ${v.ano_modelo}` : ''}${v.placa ? ` (${v.placa})` : ''}`
  return {
    pedido: {
      comando: 'VENDIDO',
      alvo: { id: v.id, nome },
      resumo: `VENDIDO ${nome}`,
      pergunta: `🚗 Quer realmente marcar como *VENDIDO* e remover do site?\n\n*${nome}*\n\nResponda *SIM* ou *NÃO* (vale por ${VALIDADE_MINUTOS} minutos).`,
    },
  }
}

// EXECUTA e CONFIRMA: depois do UPDATE, le o veiculo de volta.
export async function executarVendido(
  alvo: Record<string, any>,
  ctx: CommandContext,
): Promise<string> {
  const { error } = await ctx.supabase
    .from('veiculos')
    .update({ status: 'vendido', exibir_no_site: false })
    .eq('id', alvo.id)
  if (error)
    return `❌ Não consegui marcar *${alvo.nome}* como vendido. O veículo continua como estava.`

  const { data } = await ctx.supabase
    .from('veiculos')
    .select('status, exibir_no_site')
    .eq('id', alvo.id)
    .maybeSingle()
  if (data?.status === 'vendido' && data?.exibir_no_site === false) {
    return `✅ Confirmado: *${alvo.nome}* está como *Vendido* e fora do site. (Conferi no banco depois de salvar.)`
  }
  return `⚠️ Pedi a alteração, mas ao reler o veículo *${alvo.nome}* ele aparece como "${data?.status ?? 'ilegível'}" (no site: ${data?.exibir_no_site ?? '?'}). Confira no painel.`
}
