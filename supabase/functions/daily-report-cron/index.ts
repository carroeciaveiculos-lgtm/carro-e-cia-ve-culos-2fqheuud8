import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: leads24h, error: leadsError } = await supabase
      .from('leads')
      .select('id, source, origem, nome')
      .gte('created_at', yesterday)

    if (leadsError) throw leadsError

    // Prioriza origem sobre source (19/08/2026, padronização de
    // vocabulário) — source é genérico demais (ex: "whatsapp" pra tudo que
    // vem de WhatsApp, sem distinguir anúncio de contato espontâneo).
    const leadsBySource: Record<string, number> = {}
    for (const lead of leads24h || []) {
      const src = lead.origem || lead.source || 'desconhecido'
      leadsBySource[src] = (leadsBySource[src] || 0) + 1
    }

    // Alerta de canal silencioso (19/08/2026, pedido da Adriana) — só os
    // canais que hoje geram lead de verdade; Mercado Livre/Webmotors/NaPista
    // ficam de fora por enquanto (nunca geraram lead nenhum, é achado já
    // conhecido e agendado pra depois — ver docs/origem-leads.md — incluir
    // aqui só criaria alerta repetido todo dia sobre a mesma coisa).
    const CANAIS_MONITORADOS = ['facebook_ads', 'instagram_ads', 'whatsapp_organico', 'site_whatsapp']
    const LIMITE_DIAS_SILENCIO = 7
    const alertasSilencio: string[] = []
    for (const canal of CANAIS_MONITORADOS) {
      const { data: ultimoLead } = await supabase
        .from('leads')
        .select('created_at')
        .eq('origem', canal)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!ultimoLead) continue
      const diasSemLead = Math.floor(
        (Date.now() - new Date(ultimoLead.created_at).getTime()) / (24 * 60 * 60 * 1000),
      )
      if (diasSemLead >= LIMITE_DIAS_SILENCIO) {
        alertasSilencio.push(`   ⚠️ ${canal}: sem lead há ${diasSemLead} dias`)
      }
    }

    const { count: soldVehicles, error: soldError } = await supabase
      .from('veiculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Vendido')
      .gte('updated_at', yesterday)

    if (soldError) throw soldError

    const { count: totalActiveAds, error: adsError } = await supabase
      .from('ml_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (adsError) throw adsError

    const { count: totalAvailable, error: availError } = await supabase
      .from('veiculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'disponivel')
      .eq('exibir_no_site', true)

    if (availError) throw availError

    const totalLeads = leads24h?.length || 0
    const sourceBreakdown =
      Object.entries(leadsBySource)
        .map(([src, count]) => `   • ${src}: ${count}`)
        .join('\n') || '   • Nenhum lead nas últimas 24h'

    const reportText = `🌅 *Bom dia! Relatório Diário - Carro e Cia*

📅 *Resumo das últimas 24h:*

📋 *Leads Recebidos:* ${totalLeads}
${sourceBreakdown}

🚗 *Veículos Vendidos:* ${soldVehicles || 0}
📦 *Estoque Ativo:* ${totalAvailable || 0} veículos disponíveis
📱 *Anúncios ML Ativos:* ${totalActiveAds || 0}
${alertasSilencio.length > 0 ? `\n🚨 *Canal sem lead há dias:*\n${alertasSilencio.join('\n')}\n` : ''}
${totalLeads > 0 ? `🔥 ${totalLeads} novas oportunidades para trabalhar hoje!` : '💡 Que tal investir em novos anúncios hoje?'}

_Tenha um excelente dia de vendas! 🚀_`

    const waToken = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')!
    const waPhoneId =
      Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID')!

    const { data: socialConfig } = await supabase
      .from('social_configuracoes')
      .select('whatsapp_number')
      .maybeSingle()

    const ownerPhone = socialConfig?.whatsapp_number || '5534999484285'

    if (waToken && waPhoneId) {
      await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: ownerPhone.replace(/\D/g, ''),
          type: 'text',
          text: { body: reportText },
        }),
      })
    }

    await supabase.from('marketing_logs').insert({
      tipo: 'daily_report',
      status: 'enviado',
      detalhes: {
        total_leads: totalLeads,
        leads_by_source: leadsBySource,
        sold_vehicles: soldVehicles || 0,
        active_ads: totalActiveAds || 0,
        available_stock: totalAvailable || 0,
        canais_silenciosos: alertasSilencio,
        sent_to: ownerPhone,
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        report: reportText,
        stats: {
          total_leads: totalLeads,
          leads_by_source: leadsBySource,
          sold_vehicles: soldVehicles || 0,
          active_ads: totalActiveAds || 0,
          available_stock: totalAvailable || 0,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('Daily report error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
