import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

// 25/11/2026 (pedido da Adriana, Bloco B): resumo de leads às 8h (Brasília) para o Pedro
// Cardoso, com o template aprovado `resumo_diario_leads`. Chamada pelo cron diário às 11:00 UTC
// com `x-internal-secret`. `{ dry_run: true }` calcula os números e NÃO envia (teste).
// Grava a resposta REAL da Meta em marketing_logs (o daily-report-cron antigo não fazia isso).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-internal-secret',
}

const TEMPLATE = 'resumo_diario_leads'
const DESTINOS = ['5534997150409'] // Pedro Cardoso
const LOG_TIPO = 'resumo_leads_pedro'
const FUSO = 'America/Sao_Paulo' // sem horário de verão desde 2019: sempre UTC-3

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
    const corpoReq = await req.json().catch(() => ({}))
    const dryRun = corpoReq?.dry_run === true

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const agora = new Date()
    const ha24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString()
    // "Hoje" no horário de Brasília: data AAAA-MM-DD e os limites do dia em UTC-3.
    const hojeBR = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(agora)
    const inicioDia = new Date(`${hojeBR}T00:00:00-03:00`).toISOString()
    const fimDia = new Date(new Date(inicioDia).getTime() + 24 * 60 * 60 * 1000).toISOString()
    const rotuloDia = new Intl.DateTimeFormat('pt-BR', {
      timeZone: FUSO,
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    }).format(agora)

    const contar = async (q: any) => {
      const { count, error } = await q
      if (error) throw error
      return count || 0
    }

    const [novos24h, emConversa, visitasHoje, paradosNovo] = await Promise.all([
      contar(
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', ha24h),
      ),
      contar(
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'em_contato'),
      ),
      contar(
        supabase
          .from('agendamentos_visita')
          .select('id', { count: 'exact', head: true })
          .gte('data_hora', inicioDia)
          .lt('data_hora', fimDia)
          // neq sozinho também tiraria os sem status (NULL); só cancelado sai da conta.
          .or('status.is.null,status.neq.cancelado'),
      ),
      contar(
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'novo')
          .lt('created_at', ha24h),
      ),
    ])

    const parametros = [rotuloDia, novos24h, emConversa, visitasHoje, paradosNovo].map(String)
    if (dryRun) return json({ success: true, dry_run: true, template: TEMPLATE, parametros })

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
      if (!res.ok) console.error(`Meta recusou ${TEMPLATE}:`, res.status, corpo)
      await supabase.from('marketing_logs').insert({
        tipo: LOG_TIPO,
        status: res.ok ? 'aceito_meta' : 'recusado_meta',
        detalhes: {
          destino_final: to.slice(-4),
          http: res.status,
          numeros: { novos24h, emConversa, visitasHoje, paradosNovo },
          resposta: res.ok ? null : corpo.slice(0, 500),
        },
      })
      resultados.push({ destino_final: to.slice(-4), ok: res.ok, http: res.status })
    }

    return json({ success: resultados.every((r) => r.ok), resultados, parametros })
  } catch (err: any) {
    console.error('resumo-leads-cron:', err)
    return json({ success: false, error: err.message }, 500)
  }
})
