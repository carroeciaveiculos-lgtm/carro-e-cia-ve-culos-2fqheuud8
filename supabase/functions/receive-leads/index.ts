import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { encontrarLeadAtivo, anexarNotaContato, normalizarTelefone } from '../_shared/lead-dedup.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Meta Webhook Verification Token
const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'carro_e_cia_verify_123'
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '1231947963330780'
const WHATSAPP_WABA_ID = Deno.env.get('WHATSAPP_WABA_ID') || '1530053735172401'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully!')
      return new Response(challenge, { status: 200 })
    } else {
      return new Response('Forbidden', { status: 403 })
    }
  }

  try {
    const payload = await req.json()
    console.log('Received webhook payload:', JSON.stringify(payload))

    const platform =
      payload.object === 'instagram'
        ? 'instagram'
        : payload.object === 'whatsapp_business_account'
          ? 'whatsapp'
          : 'facebook'

    await supabase.from('meta_webhook_logs').insert({
      platform,
      event_type: payload.object,
      payload,
      processed: true,
    })

    if (
      payload.object === 'page' ||
      payload.object === 'instagram' ||
      payload.object === 'whatsapp_business_account'
    ) {
      const entries = payload.entry || []

      for (const entry of entries) {
        const changes = entry.changes || []

        for (const change of changes) {
          const field = change.field
          const value = change.value

          // 1. Handle Public Comments / Feed -> Moderador Dashboard
          if (field === 'feed' || field === 'comments') {
            if (value.item === 'comment' && value.verb !== 'remove') {
              await supabase.from('social_comments').insert({
                post_id: value.post_id || '',
                comment_id: value.comment_id || '',
                from_id: value.from?.id || '',
                from_name: value.from?.name || 'Unknown',
                message: value.message || '',
                platform: platform,
                is_replied: false,
              })
              console.log('Public comment logged to social_comments.')
            }
            continue // Skip lead generation for public comments
          }

          // 2. Handle Meta Lead Ads (leadgen) -> CRM Lead Pipeline
          if (field === 'leadgen') {
            const leadgenId = value?.leadgen_id
            const formId = value?.form_id

            if (leadgenId) {
              const pageToken =
                Deno.env.get('META_PAGE_ACCESS_TOKEN') || Deno.env.get('META_ADS_TOKEN') || ''
              if (pageToken) {
                try {
                  const leadRes = await fetch(
                    `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${pageToken}`,
                  )
                  const leadData = await leadRes.json()
                  const fieldData = leadData.field_data || []
                  const getField = (name: string) => {
                    const field = fieldData.find((f: any) => f.name === name)
                    return field?.values?.[0] || ''
                  }

                  const leadNome = getField('full_name') || getField('name') || 'Lead Meta Ads'
                  const leadTelefoneRaw = getField('phone_number') || getField('phone') || ''
                  const leadEmail = getField('email') || ''
                  const leadInteresse =
                    getField('vehicle') || getField('interesse') || getField('produto') || ''
                  const cleanTelefone = leadTelefoneRaw.replace(/\D/g, '')

                  const { data: existingLeads } = await supabase
                    .from('leads')
                    .select('id')
                    .eq('telefone', cleanTelefone)
                    .limit(1)

                  let leadId = existingLeads?.[0]?.id

                  if (!leadId && cleanTelefone) {
                    const { data: newLead } = await supabase
                      .from('leads')
                      .insert({
                        nome: leadNome,
                        telefone: cleanTelefone,
                        email: leadEmail || null,
                        origem: 'meta_lead_ads',
                        source: 'meta_lead_ads',
                        veiculo_interesse: leadInteresse || null,
                        tipo: 'compra',
                        status: 'novo',
                        temperatura: 'quente',
                        campanha: 'facebook_lead_ads',
                      })
                      .select()
                      .single()
                    leadId = newLead?.id

                    if (leadId) {
                      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
                      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

                      await fetch(`${supabaseUrl}/functions/v1/on-lead-created`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${serviceKey}`,
                        },
                        body: JSON.stringify({
                          id: leadId,
                          nome: leadNome,
                          email: leadEmail,
                          telefone: cleanTelefone,
                        }),
                      }).catch(console.error)

                      await fetch(`${supabaseUrl}/functions/v1/ai-sdr`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${serviceKey}`,
                        },
                        body: JSON.stringify({
                          action: 'init_conversation',
                          lead_id: leadId,
                          source: 'meta_lead_ads',
                          veiculo: leadInteresse,
                        }),
                      }).catch(console.error)

                      const waToken = Deno.env.get('WHATSAPP_TOKEN') || ''
                      const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || ''
                      if (waToken && waPhoneId) {
                        await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${waToken}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            messaging_product: 'whatsapp',
                            to: '5534999484285',
                            type: 'text',
                            text: {
                              body: `\u{1F514} *Novo Lead via Meta Lead Ads!*\n\n\u{1F464} Nome: ${leadNome}\n\ud83d\udcde Telefone: ${cleanTelefone || 'N/A'}\n\ud83d\udce7 Email: ${leadEmail || 'N/A'}\n\ud83d\ude97 Interesse: ${leadInteresse || 'N/A'}\n\nAcesse o CRM para atendimento.`,
                            },
                          }),
                        }).catch(console.error)
                      }

                      console.log(`Lead Ads captured: ${leadNome} (${cleanTelefone})`)
                    }
                  }
                } catch (e) {
                  console.error('Error fetching leadgen data:', e)
                }
              }
            }
            continue
          }

          // 3. Handle Private Messages (DMs / WhatsApp) -> CRM
          if (field === 'messages') {
            if (payload.object === 'whatsapp_business_account') {
              console.log(
                `Processing WhatsApp message for Phone ID: ${WHATSAPP_PHONE_NUMBER_ID}, WABA ID: ${WHATSAPP_WABA_ID}`,
              )

              const messages = value.messages || []
              const contacts = value.contacts || []

              for (const msg of messages) {
                const contact = contacts.find((c: any) => c.wa_id === msg.from)
                const senderName = contact?.profile?.name || 'Cliente WhatsApp'
                const senderPhone = msg.from
                const messageText = msg.text?.body || ''

                const { data: leads } = await supabase
                  .from('leads')
                  .select('id')
                  .eq('telefone', senderPhone)
                  .limit(1)

                let leadId = leads?.[0]?.id

                if (!leadId) {
                  // Origem real da mensagem (12/08/2026, achado da auditoria de
                  // leads): antes toda mensagem de WhatsApp virava origem
                  // "whatsapp" genérico, mesmo vindo de anúncio (clique-para-
                  // WhatsApp do Facebook/Instagram). A Meta manda um objeto
                  // `referral` na primeira mensagem desses casos — sem ele, é
                  // contato orgânico de verdade (não veio de anúncio).
                  const referral = msg.referral
                  let origemDetectada = 'whatsapp_organico'
                  let campanhaDetectada: string | null = null
                  if (referral) {
                    const sourceUrl = (referral.source_url || '').toLowerCase()
                    origemDetectada = sourceUrl.includes('instagram')
                      ? 'instagram_ads'
                      : 'facebook_ads'
                    campanhaDetectada = referral.headline || referral.source_id || null
                  }

                  const { data: newLead } = await supabase
                    .from('leads')
                    .insert({
                      nome: senderName,
                      telefone: senderPhone,
                      origem: origemDetectada,
                      source: 'whatsapp',
                      campanha: campanhaDetectada,
                      utm_campaign: referral?.source_id || null,
                      tipo: 'compra',
                      status: 'novo',
                    })
                    .select()
                    .single()
                  leadId = newLead?.id
                }

                if (leadId) {
                  await supabase.from('conversation_history').insert({
                    lead_id: leadId,
                    sender: senderName,
                    message_text: messageText,
                  })

                  // Reativado em 12/08/2026 — chama a Clara pra responder de
                  // verdade a mensagens depois da primeira (ver ai-sdr,
                  // action 'continue_conversation'). Ficava comentado, sem
                  // nenhuma automação depois do primeiro contato. A própria
                  // action confere `leads.ai_enabled` e pula se um humano já
                  // assumiu a conversa — não precisa checar aqui de novo.
                  // `await` de propósito: função Deno não garante execução
                  // em segundo plano depois da resposta HTTP sem
                  // EdgeRuntime.waitUntil (não usado em nenhum outro lugar do
                  // projeto ainda, não quis introduzir sem testar isolado).
                  if (messageText) {
                    try {
                      await supabase.functions.invoke('ai-sdr', {
                        body: { action: 'continue_conversation', lead_id: leadId, mensagem: messageText },
                      })
                    } catch (e) {
                      console.error('Erro ao chamar ai-sdr:', e)
                    }
                  }
                }
              }
            } else {
              const senderId = value.sender?.id
              const messageText = value.message?.text

              if (senderId && messageText) {
                const { data: leads } = await supabase
                  .from('leads')
                  .select('id')
                  .eq('external_lead_id', senderId)
                  .limit(1)

                let leadId = leads?.[0]?.id

                if (!leadId) {
                  const { data: newLead } = await supabase
                    .from('leads')
                    .insert({
                      nome: `Lead ${platform}`,
                      external_lead_id: senderId,
                      origem: platform,
                      source: platform,
                      status: 'novo',
                    })
                    .select()
                    .single()
                  leadId = newLead?.id
                }

                if (leadId) {
                  await supabase.from('conversation_history').insert({
                    lead_id: leadId,
                    sender: 'Lead',
                    message_text: messageText,
                  })
                }
              }
            }
          }
        }
      }
    }

    if (payload.nome && payload.telefone && !payload.object) {
      const cleanTelefone = normalizarTelefone(payload.telefone)
      const leadExistente = await encontrarLeadAtivo(supabase, {
        telefone: cleanTelefone,
        email: payload.email || null,
      })

      const { data: newLead, error } = leadExistente
        ? await supabase
            .from('leads')
            .update({
              veiculo_interesse: payload.veiculo_interesse || undefined,
              observacoes: anexarNotaContato(leadExistente.observacoes, payload.origem || 'site'),
              updated_at: new Date().toISOString(),
            })
            .eq('id', leadExistente.id)
            .select()
            .single()
        : await supabase
            .from('leads')
            .insert({
              nome: payload.nome,
              telefone: cleanTelefone,
              email: payload.email,
              origem: payload.origem || 'site',
              veiculo_interesse: payload.veiculo_interesse,
              status: 'novo',
            })
            .select()
            .single()

      if (error) throw error

      return new Response(JSON.stringify({ success: true, lead: newLead }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Error processing webhook:', err)
    await supabase
      .from('lead_errors')
      .insert({
        lead_data: { source: 'receive-leads', timestamp: new Date().toISOString() },
        error_message: err.message,
      })
      .catch(() => {})
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
