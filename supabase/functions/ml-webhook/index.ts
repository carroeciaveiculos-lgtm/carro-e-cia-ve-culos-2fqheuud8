import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getValidMLToken } from '../_shared/ml-client.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const payload = await req.json()

    if (payload.topic && payload.resource) {
      const { token, error: tokenError } = await getValidMLToken(supabase)
      if (tokenError || !token) {
        return new Response(JSON.stringify({ error: tokenError || 'No ML token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const resourceUrl = payload.resource
      const detailRes = await fetch(resourceUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!detailRes.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch resource details' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const resource = await detailRes.json()

      if (payload.topic === 'questions' && resource.text) {
        const buyerId = resource.from?.id
        const buyerName = resource.from?.nickname || 'Cliente ML'
        const itemId = resource.item_id
        const questionText = resource.text

        let veiculoId: string | null = null
        let veiculoInteresse = ''

        if (itemId) {
          const { data: listing } = await supabase
            .from('ml_listings')
            .select('veiculo_id')
            .eq('ml_item_id', itemId)
            .maybeSingle()

          if (listing) {
            veiculoId = listing.veiculo_id
            const { data: veiculo } = await supabase
              .from('veiculos')
              .select('marca, modelo, ano_modelo')
              .eq('id', listing.veiculo_id)
              .maybeSingle()
            if (veiculo) {
              veiculoInteresse =
                `${veiculo.marca} ${veiculo.modelo} ${veiculo.ano_modelo || ''}`.trim()
            }
          }
        }

        const { data: existingLead } = await supabase
          .from('leads')
          .select('id, telefone')
          .eq('external_lead_id', String(buyerId))
          .eq('source', 'mercadolivre')
          .maybeSingle()

        let leadId = existingLead?.id

        if (!leadId) {
          const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert({
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
            .select()
            .single()

          if (leadError) throw leadError
          leadId = newLead?.id

          if (leadId) {
            try {
              await supabase.functions.invoke('ai-sdr', {
                body: {
                  action: 'init_conversation',
                  lead_id: leadId,
                  source: 'mercadolivre',
                  veiculo: veiculoInteresse || 'nosso estoque',
                },
              })
            } catch (aiErr) {
              console.error('AI SDR invocation failed:', aiErr)
            }
          }
        }
      }

      if (payload.topic === 'items' && resource.contact) {
        const buyerName = resource.buyer?.nickname || 'Cliente ML'
        const buyerPhone = resource.buyer?.phone?.number || ''
        const buyerEmail = resource.buyer?.email || ''
        const itemId = resource.item_id

        let veiculoId: string | null = null
        let veiculoInteresse = ''

        if (itemId) {
          const { data: listing } = await supabase
            .from('ml_listings')
            .select('veiculo_id')
            .eq('ml_item_id', itemId)
            .maybeSingle()

          if (listing) {
            veiculoId = listing.veiculo_id
            const { data: veiculo } = await supabase
              .from('veiculos')
              .select('marca, modelo, ano_modelo')
              .eq('id', listing.veiculo_id)
              .maybeSingle()
            if (veiculo) {
              veiculoInteresse =
                `${veiculo.marca} ${veiculo.modelo} ${veiculo.ano_modelo || ''}`.trim()
            }
          }
        }

        const { data: newLead, error: leadError } = await supabase
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

        if (leadError) throw leadError

        if (newLead) {
          if (buyerPhone) {
            try {
              await supabase.functions.invoke('send-whatsapp', {
                body: {
                  action: 'text',
                  to: buyerPhone,
                  text: `Olá ${buyerName}! Recebemos seu contato sobre o ${veiculoInteresse || 'veículo'} na nossa loja. Sou o Luiz, consultor da Carro e Cia. Como posso te ajudar hoje?`,
                  leadId: newLead.id,
                },
              })
            } catch (waErr) {
              console.error('WhatsApp send failed:', waErr)
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
          } catch (aiErr) {
            console.error('AI SDR invocation failed:', aiErr)
          }
        }
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
