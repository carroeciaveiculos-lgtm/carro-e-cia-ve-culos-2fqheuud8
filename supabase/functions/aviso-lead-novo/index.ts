import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'
import { isEquipePhone } from '../_shared/whatsapp-commands.ts'

// 25/11/2026 (pedido da Adriana, Bloco B): todo lead novo avisa o Pedro Cardoso (vendedor do
// pré-atendimento) no WhatsApp, com o template aprovado `aviso_novo_lead` — template chega a
// qualquer hora; texto livre só dentro da janela de 24 h (erro 131047), por isso não há
// texto livre de reserva aqui.
// Chamada pela regra do banco ao inserir em `leads` (migration do aviso de lead novo), com
// `x-internal-secret`. `{ lead_id, dry_run: true }` monta a mensagem e NÃO envia (teste).
// Diferente do daily-report-cron antigo, grava a resposta REAL da Meta em marketing_logs.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-internal-secret',
}

const TEMPLATE = 'aviso_novo_lead'
const DESTINOS = ['5534997150409'] // Pedro Cardoso
const LOG_TIPO = 'aviso_lead_novo'

const ORIGENS: Record<string, string> = {
  facebook_ads: 'Facebook Ads',
  instagram_ads: 'Instagram Ads',
  whatsapp_organico: 'WhatsApp (contato direto)',
  site_whatsapp: 'Site (botão WhatsApp)',
  site_formulario: 'Site (formulário)',
  site_consignacao: 'Site (consignação)',
  clara: 'Clara (WhatsApp)',
}

// Parâmetros de template não aceitam quebra de linha, tab nem 4+ espaços seguidos.
function limpar(valor: string | null | undefined): string {
  return (
    (valor || '')
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/ {2,}/g, ' ')
      .trim()
      .slice(0, 200) || '-'
  )
}

function formatarTelefone(valor: string | null): string {
  let d = (valor || '').replace(/\D/g, '')
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return limpar(valor)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  try {
    const { lead_id, dry_run } = await req.json()
    if (!lead_id) return json({ success: false, error: 'lead_id obrigatório' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, nome, telefone, origem, source, veiculo_interesse, veiculo_id')
      .eq('id', lead_id)
      .maybeSingle()
    if (error) throw error
    if (!lead) return json({ success: false, error: 'lead não encontrado' }, 404)

    // Número da equipe não deveria virar lead (receive-leads já barra), mas se virar não avisa.
    if (lead.telefone && isEquipePhone(lead.telefone)) {
      return json({ success: true, skipped: 'numero_da_equipe' })
    }

    // Um aviso por lead, mesmo que a regra do banco dispare de novo.
    if (!dry_run) {
      const { count } = await supabase
        .from('marketing_logs')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', LOG_TIPO)
        .eq('status', 'aceito_meta')
        .eq('detalhes->>lead_id', lead.id)
      if ((count || 0) > 0) return json({ success: true, skipped: 'ja_avisado' })
    }

    let interesse = lead.veiculo_interesse as string | null
    if (!interesse && lead.veiculo_id) {
      const { data: v } = await supabase
        .from('veiculos')
        .select('marca, modelo, ano_modelo')
        .eq('id', lead.veiculo_id)
        .maybeSingle()
      if (v) interesse = [v.marca, v.modelo, v.ano_modelo].filter(Boolean).join(' ')
    }

    const origemBruta = lead.origem || lead.source || ''
    const parametros = [
      limpar(lead.nome),
      formatarTelefone(lead.telefone),
      limpar(ORIGENS[origemBruta] || origemBruta),
      limpar(interesse),
    ]

    if (dry_run) return json({ success: true, dry_run: true, template: TEMPLATE, parametros })

    const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')
    const waPhoneId =
      Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')
    if (!waToken || !waPhoneId) throw new Error('Credenciais do WhatsApp ausentes')

    const resultados = []
    for (const to of DESTINOS) {
      const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: TEMPLATE,
            language: { code: 'pt_BR' },
            components: [
              { type: 'body', parameters: parametros.map((text) => ({ type: 'text', text })) },
            ],
          },
        }),
      })
      const corpo = await res.text()
      const ok = res.ok
      if (!ok) console.error(`Meta recusou ${TEMPLATE}:`, res.status, corpo)
      // Só o id do lead e a resposta da Meta no log — nada de nome/telefone do cliente.
      await supabase.from('marketing_logs').insert({
        tipo: LOG_TIPO,
        status: ok ? 'aceito_meta' : 'recusado_meta',
        detalhes: {
          lead_id: lead.id,
          destino_final: to.slice(-4),
          http: res.status,
          resposta: ok ? null : corpo.slice(0, 500),
        },
      })
      resultados.push({ destino_final: to.slice(-4), ok, http: res.status })
    }

    return json({ success: resultados.every((r) => r.ok), resultados })
  } catch (err: any) {
    console.error('aviso-lead-novo:', err)
    return json({ success: false, error: err.message }, 500)
  }
})
