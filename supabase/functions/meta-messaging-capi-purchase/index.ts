import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { enviarEventoMensagem } from '../_shared/meta-messaging-capi.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Disparado pelo trigger de banco trigger_notify_lead_fechado (ver migration
// leads_ctwa_clid_e_trigger_purchase_capi) sempre que leads.status vira
// 'fechado'. Manda o evento Purchase pro Conversions API for Messaging —
// mesmo padrao ja usado em meta-capi-postback pro Pixel do site, mas nesse
// dataset separado (carroecia_mensagens), ligado ao WhatsApp.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { lead_id, telefone, ctwa_clid, veiculo_interesse, valor_veiculo } = await req.json()

    if (!lead_id || !telefone) {
      return new Response(JSON.stringify({ error: 'lead_id e telefone sao obrigatorios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Testado contra o validador real da Meta (24/08/2026): ctwa_clid e
    // OBRIGATORIO nesse dataset — sem ele a Meta rejeita o evento inteiro.
    // Leads que fecharam sem nunca ter capturado ctwa_clid (organico, ou
    // fechados antes dessa coluna existir) nao tem como mandar esse evento.
    if (!ctwa_clid) {
      return new Response(
        JSON.stringify({ success: false, skipped: 'sem_ctwa_clid', lead_id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const resultado = await enviarEventoMensagem({
      eventName: 'Purchase',
      eventId: `purchase-${lead_id}`,
      telefone,
      ctwaClid: ctwa_clid || null,
      valor: typeof valor_veiculo === 'number' ? valor_veiculo : null,
    })

    return new Response(
      JSON.stringify({ success: resultado.ok, veiculo_interesse, capi_response: resultado.body }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('Erro em meta-messaging-capi-purchase:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
