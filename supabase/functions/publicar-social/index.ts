import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

// Função para garantir que fotos .webp do Supabase sejam servidas em .jpeg para o Meta aceitar
function sanitizeImage(url: string): string {
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return (
      url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?format=jpeg'
    )
  }
  return url
}

// Polling inteligente para aguardar o Meta processar o upload do vídeo antes de publicar
async function waitForInstagramMediaReady(
  containerId: string,
  token: string,
  maxAttempts = 10,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(
      `Verificando processamento do vídeo no Instagram (Tentativa ${attempt}/${maxAttempts})...`,
    )

    const statusRes = await fetch(
      `https://graph.facebook.com/v20.0/${containerId}?fields=status_code&access_token=${token}`,
    )
    const statusData = await statusRes.json()

    if (statusData.status_code === 'FINISHED') {
      console.log('Vídeo processado com sucesso pelo Meta!')
      return true
    }

    if (statusData.status_code === 'ERROR') {
      console.error('Erro reportado pelo Meta no processamento do vídeo:', statusData)
      return false
    }

    // Aguarda 3 segundos antes de checar novamente
    await delay(3000)
  }
  console.warn('Tempo de processamento de vídeo esgotado.')
  return false
}

// Achado em auditoria (14/08/2026, pedido da Adriana): faltava o import de
// isInternalRequestAuthorized/unauthorizedResponse — toda chamada (manual ou
// agendada) quebrava na hora com ReferenceError, antes mesmo de tentar
// publicar. Também nunca existiu cron chamando esta function — mesmo com o
// bug corrigido, nada disparava a publicação no horário agendado sozinho
// (ver migração deste mesmo commit).
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const token = Deno.env.get('META_PAGE_ACCESS_TOKEN')
    const pageId = Deno.env.get('FACEBOOK_PAGE_ID')
    const igId = Deno.env.get('INSTAGRAM_BUSINESS_ID')

    // Carregar posts agendados que já passaram do horário de publicação
    const { data: posts, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'Agendado')
      .lte('data_agendamento', new Date().toISOString())

    if (error) throw error

    let processed = 0

    for (const post of posts || []) {
      const redes = typeof post.redes === 'string' ? JSON.parse(post.redes) : post.redes

      let fbSuccess = false
      let igSuccess = false
      const errorLog: any = {}

      const imageUrlSanitized = post.imagem ? sanitizeImage(post.imagem) : null

      // 1. PUBLICAR NO FACEBOOK
      if (redes.facebook && pageId && token) {
        console.log(`Iniciando publicação do post ${post.id} no Facebook...`)
        let fbUrl = `https://graph.facebook.com/v20.0/${pageId}/feed`
        let payload: any = { access_token: token, message: post.texto }

        // Se houver imagem, publica como foto, senão como post comum de texto
        if (imageUrlSanitized) {
          fbUrl = `https://graph.facebook.com/v20.0/${pageId}/photos`
          payload = {
            access_token: token,
            url: imageUrlSanitized,
            message: post.texto,
          }
        }

        try {
          const fbRes = await fetch(fbUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const fbData = await fbRes.json()
          if (fbRes.ok) {
            fbSuccess = true
            console.log('Publicação realizada com sucesso no Facebook!')
          } else {
            errorLog.facebook = fbData
            console.error('Falha ao publicar no Facebook:', fbData)
          }
        } catch (e: any) {
          errorLog.facebook = e.message
        }
      }

      // 2. PUBLICAR NO INSTAGRAM
      if (redes.instagram && igId && token && imageUrlSanitized) {
        console.log(`Iniciando publicação do post ${post.id} no Instagram...`)
        const isVideo = imageUrlSanitized.match(/\.(mp4|mov|webm)/i)

        try {
          const containerRes = await fetch(`https://graph.facebook.com/v20.0/${igId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: token,
              [isVideo ? 'video_url' : 'image_url']: imageUrlSanitized,
              caption: post.texto,
              media_type: isVideo ? 'REELS' : 'IMAGE',
            }),
          })
          const containerData = await containerRes.json()

          if (containerData.id) {
            let readyToPublish = true

            // Se for vídeo, aguarda o Meta finalizar o processamento em background antes de tentar publicar
            if (isVideo) {
              readyToPublish = await waitForInstagramMediaReady(containerData.id, token)
            }

            if (readyToPublish) {
              const publishRes = await fetch(
                `https://graph.facebook.com/v20.0/${igId}/media_publish`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    access_token: token,
                    creation_id: containerData.id,
                  }),
                },
              )

              const publishData = await publishRes.json()
              if (publishRes.ok) {
                igSuccess = true
                console.log('Publicação realizada com sucesso no Instagram!')
              } else {
                errorLog.instagram = publishData
                console.error('Falha ao publicar contêiner no Instagram:', publishData)
              }
            } else {
              errorLog.instagram = {
                error: 'O vídeo não ficou pronto para publicação no tempo limite.',
              }
            }
          } else {
            errorLog.instagram = containerData
            console.error('Falha ao criar contêiner de mídia no Instagram:', containerData)
          }
        } catch (e: any) {
          errorLog.instagram = e.message
        }
      }

      // 3. ATUALIZAÇÃO DE STATUS E GRAVAÇÃO DE LOGS DETALHADOS
      // O post só é dado como 'Publicado' se todas as redes solicitadas tiverem sucesso
      const requestedFb = !!redes.facebook
      const requestedIg = !!redes.instagram

      const fbResultOk = !requestedFb || fbSuccess
      const igResultOk = !requestedIg || igSuccess
      const isTotalSuccess = fbResultOk && igResultOk

      const newStatus = isTotalSuccess ? 'Publicado' : 'Erro'

      await supabase.from('social_posts').update({ status: newStatus }).eq('id', post.id)

      await supabase.from('logs_integracao').insert({
        portal: 'meta_social',
        status: newStatus,
        payload_erro: isTotalSuccess ? null : errorLog,
        veiculo_id: post.veiculo_id || null,
      })

      processed++
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
