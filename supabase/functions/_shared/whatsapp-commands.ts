import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  handleLeads,
  handleQuentes,
  handleHoje,
  prepararResponder,
  executarResponder,
} from '../_shared/whatsapp-crm.ts'
import {
  handleEstoque,
  handleBuscar,
  prepararVendido,
  executarVendido,
} from '../_shared/whatsapp-estoque.ts'
import {
  handleAnuncios,
  handleListar,
  handleGasto,
  prepararToggle,
  executarToggle,
  prepararOrcamento,
  executarOrcamento,
} from '../_shared/whatsapp-ads.ts'
import {
  handleSugerir,
  handleVer,
  prepararAprovar,
  executarAprovar,
  handleCorrigir,
} from '../_shared/whatsapp-conteudo.ts'
import { interpretar, respostaConfirmacao, numeroDoItem } from '../_shared/whatsapp-intencao.ts'
import {
  salvarPendente,
  buscarPendente,
  consumirPendente,
  cancelarPendente,
  VALIDADE_MINUTOS,
  type Pendente,
  type Preparo,
} from '../_shared/whatsapp-confirmacao.ts'
import type { ItemLista } from '../_shared/whatsapp-ads.ts'

// Adriana + Fernando (docs/marketing-whatsapp-comandos.md) -- checado em
// varios webhooks (receive-leads e whatsapp-webhook, pelo menos), sempre via
// isAuthorizedPhone() abaixo, nunca comparacao direta.
export const AUTHORIZED_PHONES = ['5534984080220', '5534984080000']

// Achado 12/09/2026: o wa_id que a Meta manda pro numero da Adriana chega
// sem o 9o digito (553484080220), mesmo o numero de verdade tendo o 9
// (5534984080220) -- comparacao direta (.includes()) nunca batia. Aceita os
// dois formatos (com ou sem o 9 logo apos o DDD) pra qualquer numero da
// lista, nao so o dela, ja que o mesmo pode acontecer com qualquer numero
// brasileiro dependendo de como a conta foi registrada no WhatsApp.
function mesmoNumeroBrasileiro(a: string, b: string): boolean {
  if (a === b) return true
  const comNove = a.length === 13 ? a : b.length === 13 ? b : null
  const semNove = a.length === 12 ? a : b.length === 12 ? b : null
  if (!comNove || !semNove) return false
  // 55 + DDD(2) + 9 + 8 digitos = 13; 55 + DDD(2) + 8 digitos = 12.
  return comNove.slice(0, 4) === semNove.slice(0, 4) && comNove.slice(5) === semNove.slice(4)
}

export function isAuthorizedPhone(fromPhone: string): boolean {
  const limpo = (fromPhone || '').replace(/\D/g, '')
  return AUTHORIZED_PHONES.some((p) => mesmoNumeroBrasileiro(p, limpo))
}

type SupabaseClient = ReturnType<typeof createClient>

export interface CommandContext {
  supabase: SupabaseClient
  supabaseUrl: string
  supabaseServiceKey: string
  internalSecret: string
  waToken: string
  waPhoneId: string
  fromPhone: string
}

const MENU = `*CRM:*
• LEADS
• QUENTES
• HOJE
• RESPONDER [nome] [mensagem] (peço confirmação)

*Estoque:*
• ESTOQUE
• BUSCAR [termo]
• VENDIDO [termo] (peço confirmação)

*Anúncios (Meta + Google):*
• ANUNCIOS
• LISTAR (ativos e pausados, numerados)
• PAUSAR [nome ou número] (peço confirmação)
• ATIVAR [nome ou número] (peço confirmação)
• ORÇAMENTO [nome] [valor] (peço confirmação)
• GASTO

*Conteúdo:*
• SUGERIR
• VER
• APROVAR (peço confirmação)
• CORRIGIR [instruções]

Pode escrever com suas palavras, ex.: "Clara, pausa o anúncio Hilux". Antes de alterar qualquer coisa eu confirmo com você (SIM ou NÃO) e depois confiro se deu certo.`

async function responderPreparo(
  preparo: Preparo,
  ctx: CommandContext,
  prefixo: string,
): Promise<string> {
  if ('resposta' in preparo) return prefixo + preparo.resposta
  const { comando, alvo, resumo, pergunta } = preparo.pedido
  const salvou = await salvarPendente(ctx, 'confirmacao', comando, alvo, resumo)
  if (!salvou) {
    return `${prefixo}❌ Não consegui registrar o pedido de confirmação, então NÃO fiz nada. Tente de novo.`
  }
  return prefixo + pergunta
}

// Executa o pedido que a usuaria confirmou. O UPDATE de uso unico em
// consumirPendente vem ANTES da acao: "sim" repetido nao executa duas vezes.
async function executarPendente(p: Pendente, ctx: CommandContext): Promise<string> {
  const usou = await consumirPendente(ctx, p.id)
  if (!usou) return 'Esse pedido já foi usado ou expirou. Nada foi alterado.'
  try {
    switch (p.comando) {
      case 'PAUSAR':
      case 'ATIVAR':
        return await executarToggle(p.alvo, ctx)
      case 'ORCAMENTO':
        return await executarOrcamento(p.alvo, ctx)
      case 'VENDIDO':
        return await executarVendido(p.alvo, ctx)
      case 'APROVAR':
        return await executarAprovar(p.alvo, ctx)
      case 'RESPONDER':
        return await executarResponder(p.alvo, ctx)
      default:
        return `❌ Não sei executar "${p.comando}". Nada foi alterado.`
    }
  } catch (e) {
    console.error('executarPendente', p.comando, e)
    return `❌ Deu erro ao executar (${p.resumo ?? p.comando}). Não tenho como garantir o resultado: confira no painel antes de tentar de novo.`
  }
}

function mensagemCancelamento(p: Pendente): string {
  if (p.comando === 'PAUSAR') return 'Ok, não pausei nada: continua como estava.'
  if (p.comando === 'ATIVAR') return 'Ok, não ativei nada: continua como estava.'
  if (p.comando === 'RESPONDER') return 'Ok, a mensagem não foi enviada.'
  return `Ok, cancelado. Nada foi alterado (${p.resumo ?? p.comando}).`
}

export async function processWhatsAppCommand(
  messageText: string,
  fromPhone: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  waToken: string,
  waPhoneId: string,
): Promise<string | null> {
  if (!isAuthorizedPhone(fromPhone)) return null

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const ctx: CommandContext = {
    supabase,
    supabaseUrl,
    supabaseServiceKey,
    internalSecret: Deno.env.get('INTERNAL_SERVICE_SECRET') ?? '',
    waToken,
    waPhoneId,
    fromPhone,
  }

  const text = messageText.trim()

  // 1) Existe pedido aguardando SIM/NAO? Ele vem antes de qualquer comando.
  let prefixo = ''
  const pendente = await buscarPendente(ctx, 'confirmacao')
  const confirmacao = respostaConfirmacao(text)
  if (pendente) {
    if (confirmacao === 'sim') return await executarPendente(pendente, ctx)
    if (confirmacao === 'nao') {
      await cancelarPendente(ctx, pendente.id)
      return mensagemCancelamento(pendente)
    }
    // Outra mensagem: o pedido antigo e cancelado e esta vira comando novo.
    await cancelarPendente(ctx, pendente.id)
    prefixo = `(Cancelei o pedido anterior sem executar: ${pendente.resumo ?? pendente.comando}.)\n\n`
  } else if (confirmacao) {
    return `Não há nenhum pedido aguardando confirmação (ou passou de ${VALIDADE_MINUTOS} minutos e expirou). Mande o comando de novo.`
  }

  // 2) Interpreta a frase (acento, maiuscula, sinonimos, prefixo "Clara").
  const intencao = interpretar(text)
  if (!intencao) return `${prefixo}Comando não reconhecido.\n\n${MENU}`
  const { comando } = intencao
  let args = intencao.args

  // 3) "PAUSAR 2" / "ORCAMENTO 3 50": numero da ultima lista (LISTAR).
  if (comando === 'PAUSAR' || comando === 'ATIVAR' || comando === 'ORCAMENTO') {
    const numeroSozinho = comando !== 'ORCAMENTO' ? numeroDoItem(args) : null
    const orcamentoNumerado =
      comando === 'ORCAMENTO' ? args.match(/^(\d{1,2})\s+(\d[\d.,]*)$/) : null
    const numero = numeroSozinho ?? (orcamentoNumerado ? Number(orcamentoNumerado[1]) : null)
    if (numero !== null) {
      const lista = await buscarPendente(ctx, 'lista')
      const itens = (lista?.alvo?.itens ?? []) as ItemLista[]
      if (!lista) {
        return `${prefixo}Não tenho uma lista recente pra usar o número ${numero}. Mande LISTAR primeiro (a numeração vale ${VALIDADE_MINUTOS} minutos).`
      }
      const item = itens[numero - 1]
      if (!item)
        return `${prefixo}O número ${numero} não está na última lista (ela vai de 1 a ${itens.length}).`
      args = orcamentoNumerado ? `${item.busca} ${orcamentoNumerado[2]}` : item.busca
    }
  }

  switch (comando) {
    // CRM
    case 'LEADS':
      return prefixo + (await handleLeads(ctx))
    case 'QUENTES':
      return prefixo + (await handleQuentes(ctx))
    case 'HOJE':
      return prefixo + (await handleHoje(ctx))
    case 'RESPONDER':
      return await responderPreparo(await prepararResponder(args, ctx), ctx, prefixo)

    // Estoque
    case 'ESTOQUE':
      return prefixo + (await handleEstoque(ctx))
    case 'BUSCAR':
      return prefixo + (await handleBuscar(args, ctx))
    case 'VENDIDO':
      return await responderPreparo(await prepararVendido(args, ctx), ctx, prefixo)

    // Anuncios
    case 'ANUNCIOS':
      return prefixo + (await handleAnuncios(ctx))
    case 'LISTAR': {
      const { texto, itens } = await handleListar(ctx, args === 'pausados')
      if (itens.length > 0)
        await salvarPendente(ctx, 'lista', 'LISTAR', { itens }, 'lista numerada')
      return prefixo + texto
    }
    case 'GASTO':
      return prefixo + (await handleGasto(ctx))
    case 'PAUSAR':
      return await responderPreparo(await prepararToggle(args, 'PAUSED', ctx), ctx, prefixo)
    case 'ATIVAR':
      return await responderPreparo(await prepararToggle(args, 'ACTIVE', ctx), ctx, prefixo)
    case 'ORCAMENTO':
      return await responderPreparo(await prepararOrcamento(args, ctx), ctx, prefixo)

    // Conteudo
    case 'SUGERIR':
      return prefixo + (await handleSugerir(ctx))
    case 'VER':
      return prefixo + (await handleVer(ctx))
    case 'APROVAR':
      return await responderPreparo(await prepararAprovar(ctx), ctx, prefixo)
    case 'CORRIGIR':
      return prefixo + (await handleCorrigir(args, ctx))

    case 'AJUDA':
      return `${prefixo}*Comandos da Clara:*\n\n${MENU}`
  }
}
