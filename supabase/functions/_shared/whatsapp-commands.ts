import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handleLeads, handleQuentes, handleHoje, handleResponder } from '../_shared/whatsapp-crm.ts'
import { handleEstoque, handleBuscar, handleVendido } from '../_shared/whatsapp-estoque.ts'
import {
  handleAnuncios,
  handleListar,
  handlePausar,
  handleAtivar,
  handleOrcamento,
  handleGasto,
} from '../_shared/whatsapp-ads.ts'
import {
  handleSugerir,
  handleVer,
  handleAprovar,
  handleCorrigir,
} from '../_shared/whatsapp-conteudo.ts'

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
  const upper = text.toUpperCase()

  // CRM Commands
  if (upper === 'LEADS') return await handleLeads(ctx)
  if (upper === 'QUENTES') return await handleQuentes(ctx)
  if (upper === 'HOJE') return await handleHoje(ctx)
  if (upper.startsWith('RESPONDER ')) return await handleResponder(text.substring(10).trim(), ctx)

  // Inventory Commands
  if (upper === 'ESTOQUE') return await handleEstoque(ctx)
  if (upper.startsWith('BUSCAR ')) return await handleBuscar(text.substring(7).trim(), ctx)
  if (upper.startsWith('VENDIDO ')) return await handleVendido(text.substring(8).trim(), ctx)

  // Ads Commands
  if (upper === 'ANUNCIOS') return await handleAnuncios(ctx)
  if (upper === 'LISTAR') return await handleListar(ctx)
  if (upper === 'GASTO') return await handleGasto(ctx)
  if (upper.startsWith('PAUSAR ')) return await handlePausar(text.substring(7).trim(), ctx)
  if (upper.startsWith('ATIVAR ')) return await handleAtivar(text.substring(7).trim(), ctx)
  if (upper.startsWith('ORÇAMENTO ') || upper.startsWith('ORCAMENTO ')) {
    const rest = text.substring(10).trim()
    return await handleOrcamento(rest, ctx)
  }

  // Content Commands
  if (upper === 'SUGERIR') return await handleSugerir(ctx)
  if (upper === 'VER' || upper.startsWith('VER ')) return await handleVer(ctx)
  if (upper === 'APROVAR' || upper.startsWith('APROVAR ')) return await handleAprovar(ctx)
  if (upper.startsWith('CORRIGIR ')) return await handleCorrigir(text.substring(9).trim(), ctx)

  return `Comando não reconhecido.\n\n*CRM:*\n• LEADS\n• QUENTES\n• HOJE\n• RESPONDER [nome] [mensagem]\n\n*Estoque:*\n• ESTOQUE\n• BUSCAR [termo]\n• VENDIDO [termo]\n\n*Anúncios (Meta + Google):*\n• ANUNCIOS\n• LISTAR\n• PAUSAR [nome]\n• ATIVAR [nome]\n• ORÇAMENTO [nome] [valor]\n• GASTO\n\n*Conteúdo:*\n• SUGERIR\n• VER\n• APROVAR\n• CORRIGIR [instruções]`
}
