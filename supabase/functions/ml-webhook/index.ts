import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getValidMLToken, fetchWithBackoff } from '../_shared/ml-client.ts'
import { validateHMACAsync } from '../_shared/hmac-validator.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const rawBody = await req.text()
    const webhookSecret =
      Deno.env.get('ML_WEBHOOK_SECRET') || Deno.env.get('ML_CLIENT_SECRET') || ''

    if (!webhookSecret) {
      return new Response(
        JSON.stringify({
          error: 'Webhook secret not configured (ML_WEBHOOK_SECRET / ML_CLIENT_SECRET not set)',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const signature = req.headers.get('x-signature') || ''
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing x-signature header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isValid = await validateHMACAsync(rawBody, signature, webhookSecret)

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.parse(rawBody)

    const { token, error: tokenError } = await getValidMLToken(supabase)
    if (tokenError || !token) {
      return new Response(JSON.stringify({ error: tokenError || 'No ML token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (payload.topic && payload.resource) {
      const resourceUrl = payload.resource
      const detailRes = await fetch(resourceUrl, { headers: { Authorization: `Bearer ${token}` } })

      if (!detailRes.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch resource' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const resource = await detailRes.json()

      if (payload.topic === 'questions' && resource.text) {
        await handleQuestion(supabase, token, resource)
      }

      if (payload.topic === 'items' && resource.contact) {
        await handleItemContact(supabase, token, resource)
      }
    }

    if (payload.topic === 'leads' && payload.resource) {
      const leadRes = await fetchWithBackoff(payload.resource, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (leadRes.ok) {
        const leadData = await leadRes.json()
        await handleLead(supabase, leadData)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('ML webhook error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function resolveVehicle(
  supabase: any,
  itemId: string,
): Promise<{ veiculoId: string | null; veiculoInteresse: string }> {
  if (!itemId) return { veiculoId: null, veiculoInteresse: '' }

  const { data: listing } = await supabase
    .from('ml_listings')
    .select('veiculo_id')
    .eq('ml_item_id', itemId)
    .maybeSingle()

  if (!listing) return { veiculoId: null, veiculoInteresse: '' }

  const { data: veiculo } = await supabase
    .from('veiculos')
    .select('marca, modelo, ano_modelo')
    .eq('id', listing.veiculo_id)
    .maybeSingle()

  return {
    veiculoId: listing.veiculo_id,
    veiculoInteresse: veiculo
      ? `${veiculo.marca} ${veiculo.modelo} ${veiculo.ano_modelo || ''}`.trim()
      : '',
  }
}

async function handleQuestion(supabase: any, _token: string, resource: any) {
  const buyerId = resource.from?.id
  const buyerName = resource.from?.nickname || 'Cliente ML'
  const questionText = resource.text

  const { veiculoId, veiculoInteresse } = await resolveVehicle(supabase, resource.item_id)

  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('external_lead_id', String(buyerId))
    .eq('source', 'mercadolivre')
    .maybeSingle()

  if (!existingLead) {
    await supabase.from('leads').insert({
      nome: buyerName,
      external_lead_id: String(buyerId),
      origem: 'mercadolivre',
      source: 'mercadolivre',
      tipo: 'compra',
      status: 'novo',
      temperatura: 'morno',
      veiculo_id: veiculoId,
      veiculo_interesse: veiculoInteresse,
      observacoes: `Pergunta ML: ${questionText}`,
    })
  }
}

async function handleItemContact(supabase: any, _token: string, resource: any) {
  const buyerName = resource.buyer?.nickname || 'Cliente ML'
  const buyerPhone = resource.buyer?.phone?.number || ''
  const buyerEmail = resource.buyer?.email || ''

  const { veiculoId, veiculoInteresse } = await resolveVehicle(supabase, resource.item_id)

  const { data: newLead } = await supabase
    .from('leads')
    .insert({
      nome: buyerName,
      telefone: buyerPhone || null,
      email: buyerEmail || null,
      origem: 'mercadolivre',
      source: 'mercadolivre',
      tipo: 'compra',
      status: 'novo',
      temperatura: 'quente',
      veiculo_id: veiculoId,
      veiculo_interesse: veiculoInteresse,
    })
    .select()
    .single()

  if (newLead && buyerPhone) {
    try {
      await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'text',
          to: buyerPhone,
          text: `Olá ${buyerName}! Recebemos seu contato sobre o ${veiculoInteresse}. Como podemos te ajudar?`,
          leadId: newLead.id,
        },
      })
    } catch {
      /* non-critical */
    }
  }
}

async function handleLead(supabase: any, leadData: any) {
  const buyerName = leadData.buyer?.nickname || leadData.buyer?.name || 'Cliente ML'
  const buyerPhone = leadData.buyer?.phone?.number || ''
  const buyerEmail = leadData.buyer?.email || ''
  const itemId = leadData.item_id || leadData.inventory_id

  const { veiculoId, veiculoInteresse } = await resolveVehicle(supabase, itemId)

  const { data: newLead, error } = await supabase
    .from('leads')
    .insert({
      nome: buyerName,
      telefone: buyerPhone || null,
      email: buyerEmail || null,
      origem: 'mercadolivre',
      source: 'mercadolivre',
      tipo: 'compra',
      status: 'novo',
      temperatura: 'quente',
      veiculo_id: veiculoId,
      veiculo_interesse: veiculoInteresse,
    })
    .select()
    .single()

  if (error || !newLead) return

  if (buyerPhone) {
    try {
      await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'text',
          to: buyerPhone,
          text: `Olá ${buyerName}! Recebemos seu contato sobre o ${veiculoInteresse}. Como podemos te ajudar?`,
          leadId: newLead.id,
        },
      })
    } catch {
      /* non-critical */
    }
  }

  try {
    await supabase.functions.invoke('ai-sdr', {
      body: {
        action: 'init_conversation',
        lead_id: newLead.id,
        source: 'mercadolivre',
        veiculo: veiculoInteresse || 'nosso estoque',
      },
    })
  } catch {
    /* non-critical */
  }
}
