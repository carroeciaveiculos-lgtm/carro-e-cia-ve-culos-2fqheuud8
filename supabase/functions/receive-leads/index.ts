import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { encontrarLeadAtivo, anexarNotaContato, normalizarTelefone } from '../_shared/lead-dedup.ts'
import { recalcularAiScore } from '../_shared/lead-score.ts'
import { enviarEventoMensagem } from '../_shared/meta-messaging-capi.ts'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Meta Webhook Verification Token
const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'carro_e_cia_verify_123'
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '1231947963330780'
const WHATSAPP_WABA_ID = Deno.env.get('WHATSAPP_WABA_ID') || '1530053735172401'

const R2_PUBLIC_BASE = 'https://imagens.carroeciamotors.com.br'

// Achado 19/08/2026: o `referral` que a Meta manda na primeira mensagem de
// clique-para-WhatsApp já vem com `thumbnail_url` (imagem do criativo do
// anúncio) — sempre chegou, sempre foi descartado (mesmo padrão do achado
// de referral.body em 17/08/2026). O link da Meta é assinado e expira
// (CDN do Facebook) — por isso baixa e re-hospeda no R2 (mesmo padrão de
// gerar-imagem) antes de gravar, senão a imagem para de carregar depois
// de um tempo. Nunca derruba a criação do lead se falhar — só fica sem
// thumbnail.
async function rehospedarThumbnail(thumbnailUrl: string): Promise<string | null> {
  try {
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT')
    const R2_BUCKET = Deno.env.get('R2_BUCKET') || 'carroeciamotors-imagens'
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) return null

    const imgRes = await fetch(thumbnailUrl)
    if (!imgRes.ok) return null
    const bytes = new Uint8Array(await imgRes.arrayBuffer())
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
      forcePathStyle: true,
    })
    const key = `leads-anuncios/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`
    await s3Client.send(
      new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: bytes, ContentType: contentType }),
    )
    return `${R2_PUBLIC_BASE}/${key}`
  } catch (e) {
    console.error('Falha ao re-hospedar thumbnail do anúncio:', e)
    return null
  }
}

// Achado 23/08/2026 (a pedido da Adriana, "problemas com envio e recepção
// de imagens no chat da Clara"): mensagem de imagem do WhatsApp não tem
// campo `.text` — o código só lia `msg.text?.body`, então toda foto que um
// cliente mandava virava `message_text: ''` (52 mensagens vazias
// confirmadas no banco, a mais recente do dia anterior) e nunca acionava a
// Clara (`if (messageText)` abaixo). A mídia em si não vem no payload do
// webhook, só um `id` — precisa buscar a URL de download (expira rápido) e
// os bytes via Graph API, depois re-hospedar no R2 (mesmo motivo do
// rehospedarThumbnail: link da Meta não é permanente).
async function rehospedarMidiaWhatsApp(mediaId: string): Promise<string | null> {
  try {
    const waToken = Deno.env.get('WHATSAPP_TOKEN')
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT')
    const R2_BUCKET = Deno.env.get('R2_BUCKET') || 'carroeciamotors-imagens'
    if (!waToken || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) return null

    const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${waToken}` },
    })
    if (!metaRes.ok) return null
    const metaData = await metaRes.json()
    if (!metaData.url) return null

    const imgRes = await fetch(metaData.url, { headers: { Authorization: `Bearer ${waToken}` } })
    if (!imgRes.ok) return null
    const bytes = new Uint8Array(await imgRes.arrayBuffer())
    const contentType = metaData.mime_type || imgRes.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
      forcePathStyle: true,
    })
    const key = `leads-midia/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`
    await s3Client.send(
      new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: bytes, ContentType: contentType }),
    )
    return `${R2_PUBLIC_BASE}/${key}`
  } catch (e) {
    console.error('Falha ao re-hospedar imagem recebida do WhatsApp:', e)
    return null
  }
}

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
                            to: '5534984080220',
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

                // Mensagem pra guardar no histórico (o que a equipe vê no
                // Conversador) pode ser diferente da mensagem pra Clara
                // entender (ela não tem visão de imagem — só texto).
                let messageTextBruto = ''
                let mensagemParaClara = ''
                if (msg.type === 'image' && msg.image?.id) {
                  const midiaUrl = await rehospedarMidiaWhatsApp(msg.image.id)
                  const legenda = (msg.image.caption || '').trim()
                  messageTextBruto = midiaUrl
                    ? `[IMAGEM]${midiaUrl}${legenda ? '\n' + legenda : ''}`
                    : legenda || '[Cliente enviou uma imagem — falha ao baixar do WhatsApp, confira direto no app]'
                  mensagemParaClara = legenda
                    ? `[o cliente enviou uma foto com a legenda: "${legenda}"]`
                    : '[o cliente enviou uma foto/imagem nesta mensagem]'
                } else if (msg.type && msg.type !== 'text') {
                  // Outros tipos (áudio, vídeo, documento, figurinha,
                  // localização...) ainda não têm tratamento dedicado, mas
                  // não podem mais sumir em silêncio como sumiam antes.
                  const rotulos: Record<string, string> = {
                    audio: 'um áudio',
                    video: 'um vídeo',
                    document: 'um documento',
                    sticker: 'uma figurinha',
                    location: 'uma localização',
                    contacts: 'um contato',
                  }
                  const rotulo = rotulos[msg.type] || `uma mensagem do tipo "${msg.type}"`
                  messageTextBruto = `[Cliente enviou ${rotulo} — tipo ainda não suportado no chat, confira direto no WhatsApp]`
                  mensagemParaClara = `[o cliente enviou ${rotulo} nesta mensagem, ainda não consigo abrir esse tipo de conteúdo]`
                } else {
                  messageTextBruto = msg.text?.body || ''
                }

                // Achado 18/08/2026 (auditoria de origem): clique em botão de
                // WhatsApp do site (cta-router.ts) embute uma referência no fim
                // da mensagem pré-preenchida, já que um link wa.me não carrega
                // nenhum dado — é o único jeito de saber que o contato veio do
                // site, e de qual página/botão/veículo, em vez de cair junto
                // com contato espontâneo de verdade em "whatsapp_organico".
                // Removida antes de guardar no histórico ou mandar pra Clara —
                // não deve aparecer pro time nem afetar a IA.
                const refMatch = messageTextBruto.match(
                  /\n*_ref: site\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^_]*)_\s*$/,
                )
                const messageText = refMatch
                  ? messageTextBruto.slice(0, refMatch.index).trim()
                  : messageTextBruto

                // Pra texto puro, a mensagem pra Clara é a mesma já sem a
                // referência do site (pro caso de imagem/outro tipo,
                // mensagemParaClara já foi definida acima).
                if (!mensagemParaClara) mensagemParaClara = messageText

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
                  let veiculoDoAnuncio: string | null = null
                  let utmSourceDetectado: string | null = null
                  let utmCampaignDetectado: string | null = null
                  let gclidDetectado: string | null = null
                  let thumbnailAnuncio: string | null = null
                  let videoAnuncio: string | null = null
                  // Achado 24/08/2026 (pedido da Adriana, Conversions API for
                  // Messaging): ctwa_clid identifica o clique exato no anuncio
                  // que abriu essa conversa de WhatsApp — sempre chegou dentro
                  // de referral, sempre foi descartado, igual os outros campos
                  // desse objeto antes dos achados de 17-19/08.
                  let ctwaClidDetectado: string | null = null
                  if (referral) {
                    const sourceUrl = (referral.source_url || '').toLowerCase()
                    origemDetectada = sourceUrl.includes('instagram')
                      ? 'instagram_ads'
                      : 'facebook_ads'
                    campanhaDetectada = referral.headline || referral.source_id || null
                    ctwaClidDetectado = referral.ctwa_clid || null
                    // Achado em auditoria (17/08/2026): a Meta manda o corpo do
                    // criativo do anúncio em referral.body — nos nossos anúncios
                    // isso sempre começa com "Marca Modelo Versao Ano: descrição"
                    // (gerado pelo mesmo texto comercial que usamos pra postar).
                    // Esse dado sempre chegou e sempre foi descartado — nunca
                    // virava veiculo_interesse, só o nome genérico da campanha.
                    if (referral.body) {
                      const primeiraLinha = referral.body.split('\n')[0]
                      const antesDoisPontos = primeiraLinha.split(':')[0].trim()
                      veiculoDoAnuncio = antesDoisPontos.slice(0, 200) || null
                    }
                    // Achado 19/08/2026: mesmo padrão de dado sempre chegou,
                    // sempre foi descartado — thumbnail_url/video_url do
                    // criativo, pra mostrar no Conversador qual anúncio o
                    // cliente clicou.
                    if (referral.thumbnail_url) {
                      thumbnailAnuncio = await rehospedarThumbnail(referral.thumbnail_url)
                    }
                    videoAnuncio = referral.video_url || null
                  } else if (refMatch) {
                    const [, pagina, ctaType, veiculo, utmSource, utmCampaign, gclid] = refMatch
                    origemDetectada = 'site_whatsapp'
                    campanhaDetectada = ctaType || pagina || null
                    veiculoDoAnuncio = veiculo || null
                    utmSourceDetectado = utmSource || null
                    utmCampaignDetectado = utmCampaign || null
                    gclidDetectado = gclid || null
                  }

                  const { data: newLead } = await supabase
                    .from('leads')
                    .insert({
                      nome: senderName,
                      telefone: senderPhone,
                      origem: origemDetectada,
                      source: 'whatsapp',
                      campanha: campanhaDetectada,
                      utm_campaign: referral?.source_id || utmCampaignDetectado || null,
                      utm_source: utmSourceDetectado || null,
                      gclid: gclidDetectado || null,
                      veiculo_interesse: veiculoDoAnuncio,
                      anuncio_thumbnail_url: thumbnailAnuncio,
                      anuncio_video_url: videoAnuncio,
                      ctwa_clid: ctwaClidDetectado,
                      tipo: 'compra',
                      status: 'novo',
                    })
                    .select()
                    .single()
                  leadId = newLead?.id

                  // Conversions API for Messaging (24/08/2026, pedido da
                  // Adriana): so dispara LeadSubmitted pra lead que veio de
                  // clique em anuncio de verdade (tem referral) — contato
                  // organico nao e "lead capturado por anuncio". Testado
                  // contra o validador real da Meta antes de usar aqui:
                  // ctwa_clid e OBRIGATORIO nesse dataset — sem ele a Meta
                  // rejeita o evento inteiro, entao nem tenta mandar se nao
                  // capturou (evita chamada fadada a falhar). Nunca derruba
                  // a criacao do lead se a Meta falhar de qualquer jeito.
                  if (leadId && ctwaClidDetectado && (origemDetectada === 'facebook_ads' || origemDetectada === 'instagram_ads')) {
                    try {
                      await enviarEventoMensagem({
                        eventName: 'LeadSubmitted',
                        eventId: `lead-${leadId}`,
                        telefone: senderPhone,
                        ctwaClid: ctwaClidDetectado,
                      })
                    } catch (err) {
                      console.error('Erro ao enviar LeadSubmitted pro Conversions API for Messaging:', err)
                    }
                  }
                }

                if (leadId) {
                  // Achado em auditoria (13/08/2026): conversation_history.sender
                  // tem uma trava que só aceita 'bot'/'client'/'human' — mandar o
                  // nome da pessoa aqui (ex: "Adriana Araújo") violava a trava e
                  // falhava em silêncio, então a mensagem do cliente nunca era
                  // salva (só a resposta da Clara). senderName continua guardado
                  // em leads.nome, que é onde o nome de verdade deve ficar.
                  const { error: chError } = await supabase.from('conversation_history').insert({
                    lead_id: leadId,
                    sender: 'client',
                    message_text: messageText,
                  })
                  if (chError) {
                    console.error('Erro ao salvar mensagem do cliente:', chError)
                    await supabase
                      .from('lead_errors')
                      .insert({
                        lead_data: { source: 'receive-leads', lead_id: leadId, timestamp: new Date().toISOString() },
                        error_message: `Falha ao salvar conversation_history: ${chError.message}`,
                      })
                      .catch(() => {})
                  }

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
                  // Usa mensagemParaClara (não messageText) — pra imagem/
                  // outro tipo, o texto rico com [IMAGEM]/url é só pro
                  // histórico do painel; a Clara não tem visão, recebe uma
                  // descrição em texto do que chegou.
                  if (mensagemParaClara) {
                    try {
                      await supabase.functions.invoke('ai-sdr', {
                        body: { action: 'continue_conversation', lead_id: leadId, mensagem: mensagemParaClara },
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
                  // Padronização de vocabulário (19/08/2026): DM direto no
                  // Instagram/Messenger é distinto de comentário público
                  // virado lead manualmente (ver SocialComments.tsx) e de
                  // clique-para-WhatsApp de anúncio — cada um com seu valor
                  // próprio de origem, não o nome cru da plataforma.
                  const { data: newLead } = await supabase
                    .from('leads')
                    .insert({
                      nome: `Lead ${platform}`,
                      external_lead_id: senderId,
                      origem: platform === 'instagram' ? 'instagram_dm' : 'facebook_dm',
                      source: platform,
                      status: 'novo',
                    })
                    .select()
                    .single()
                  leadId = newLead?.id
                }

                if (leadId) {
                  // Mesmo problema do ramo WhatsApp acima: 'Lead' viola a trava
                  // de conversation_history.sender — nunca gravava nada.
                  const { error: chError } = await supabase.from('conversation_history').insert({
                    lead_id: leadId,
                    sender: 'client',
                    message_text: messageText,
                  })
                  if (chError) {
                    console.error('Erro ao salvar mensagem do cliente (Instagram):', chError)
                    await supabase
                      .from('lead_errors')
                      .insert({
                        lead_data: { source: 'receive-leads', lead_id: leadId, timestamp: new Date().toISOString() },
                        error_message: `Falha ao salvar conversation_history (instagram): ${chError.message}`,
                      })
                      .catch(() => {})
                  }
                  // Achado 19/08/2026: DM de Instagram/Messenger não passa
                  // pela Clara (ai-sdr), então nunca recalculava ai_score —
                  // ver _shared/lead-score.ts.
                  await recalcularAiScore(supabase, leadId).catch((e) =>
                    console.error('Erro ao recalcular ai_score (instagram):', e),
                  )
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
              observacoes: anexarNotaContato(leadExistente.observacoes, payload.origem || 'site_formulario'),
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
              origem: payload.origem || 'site_formulario',
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
