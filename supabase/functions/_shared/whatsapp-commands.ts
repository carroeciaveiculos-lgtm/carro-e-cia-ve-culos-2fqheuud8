import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handleLeads, handleQuentes, handleHoje, handleResponder } from '../_shared/whatsapp-crm.ts'
import { handleEstoque, handleBuscar, handleVendido } from '../_shared/whatsapp-estoque.ts'
import { handleAnuncios, handlePausar, handleOrcamento } from '../_shared/whatsapp-ads.ts'
import {
  handleSugerir,
  handleVer,
  handleAprovar,
  handleCorrigir,
} from '../_shared/whatsapp-conteudo.ts'

export const AUTHORIZED_PHONE = '5534984080220'

type SupabaseClient = ReturnType<typeof createClient>

export interface CommandContext {
  supabase: SupabaseClient
  supabaseUrl: string
  supabaseServiceKey: string
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
  if (fromPhone !== AUTHORIZED_PHONE) return null

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const ctx: CommandContext = {
    supabase,
    supabaseUrl,
    supabaseServiceKey,
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
  if (upper.startsWith('PAUSAR ')) return await handlePausar(text.substring(7).trim(), ctx)
  if (upper.startsWith('ORÇAMENTO ') || upper.startsWith('ORCAMENTO ')) {
    const rest = upper.startsWith('ORÇAMENTO ')
      ? text.substring(10).trim()
      : text.substring(10).trim()
    return await handleOrcamento(rest, ctx)
  }

  // Content Commands
  if (upper === 'SUGERIR') return await handleSugerir(ctx)
  if (upper === 'VER' || upper.startsWith('VER ')) return await handleVer(ctx)
  if (upper === 'APROVAR' || upper.startsWith('APROVAR ')) return await handleAprovar(ctx)
  if (upper.startsWith('CORRIGIR ')) return await handleCorrigir(text.substring(9).trim(), ctx)

  return `Comando não reconhecido.\n\n*CRM:*\n• LEADS\n• QUENTES\n• HOJE\n• RESPONDER [nome] [mensagem]\n\n*Estoque:*\n• ESTOQUE\n• BUSCAR [termo]\n• VENDIDO [termo]\n\n*Anúncios:*\n• ANUNCIOS\n• PAUSAR [nome]\n• ORÇAMENTO [nome] [valor]\n\n*Conteúdo:*\n• SUGERIR\n• VER\n• APROVAR\n• CORRIGIR [instruções]`
}
