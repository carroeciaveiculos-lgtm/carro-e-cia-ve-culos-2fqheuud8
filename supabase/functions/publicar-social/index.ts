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

// Achado 30/09/2026: o META_PAGE_ACCESS_TOKEN virou token de USUÁRIO DO SISTEMA
// ("carroecia_bot", tipo SYSTEM_USER — válido, sem expiração, com
// pages_manage_posts). Com ele direto, POST /{page}/photos devolve "(#200)
// publish_actions not available" e NENHUM post orgânico saía no Facebook (último
// sucesso: 17/09). O Facebook exige o token DA PÁGINA pra publicar; o do sistema
// consegue gerar esse token (confirmado ao vivo: tipo PAGE, sem expiração).
// Se a troca falhar, cai no token original — nunca pior que antes.
async function obterTokenDePagina(pageId: string, token: string): Promise<string> {
  try {
    const r = await fetch(
      `https://graph.facebook.com/v20.0/${pageId}?fields=access_token&access_token=${encodeURIComponent(token)}`,
    )
    const j = await r.json()
    if (r.ok && j?.access_token) return j.access_token
    console.error('Não foi possível obter o token da página:', j?.error?.message)
  } catch (e: any) {
    console.error('Erro ao obter o token da página:', e?.message)
  }
  return token
}

// Traduz o erro cru das redes pra uma frase que a equipe entende na tela de
// aprovação (gravada em social_posts.erro_msg).
function mensagemErroAmigavel(errorLog: Record<string, any>): string {
  const nomes: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
  }
  const partes: string[] = []
  for (const rede of Object.keys(errorLog)) {
    const raw = errorLog[rede]
    const code = raw?.error?.code
    const sub = raw?.error?.error_subcode
    const msg: string =
      raw?.error?.message ||
      raw?.message ||
      (typeof raw?.error === 'string' ? raw.error : '') ||
      (typeof raw === 'string' ? raw : '') ||
      JSON.stringify(raw ?? {}).slice(0, 160)
    let texto = msg
    if (/publish_actions/i.test(msg)) {
      texto = 'a rede recusou o token de acesso da página (sem permissão de publicar) — avise o TI'
    } else if (code === 190) {
      texto = 'o token de acesso expirou ou foi invalidado — avise o TI'
    } else if (sub === 2207027 || code === 9007) {
      texto = 'a mídia ainda não estava pronta no Instagram — tente de novo em alguns minutos'
    }
    partes.push(`${nomes[rede] || rede}: ${texto.slice(0, 220)}`)
  }
  return partes.join(' | ') || 'Falha desconhecida ao publicar'
}

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
    let fbToken: string | null = null

    for (const post of posts || []) {
      let redes = typeof post.redes === 'string' ? JSON.parse(post.redes) : post.redes
      // Achado em teste ao vivo (20/08/2026): "Ideias com IA" salva `redes`
      // como lista (['facebook','instagram']) em vez do formato objeto
      // ({facebook:true,...}) que o resto do código usa. Sem essa
      // normalização, `redes.facebook`/`redes.instagram` ficam undefined —
      // nenhuma chamada de API é feita, e o post era marcado como
      // "Publicado" mesmo assim (nenhuma rede = nenhum erro = sucesso
      // vazio). Corrigida a causa (o formato); ver também IdeiasSociais.tsx.
      if (Array.isArray(redes)) {
        redes = Object.fromEntries(redes.map((r: string) => [r, true]))
      }

      let fbSuccess = false
      let igSuccess = false
      let fbPostId: string | null = null
      let igMediaId: string | null = null
      const errorLog: any = {}

      const imageUrlSanitized = post.imagem ? sanitizeImage(post.imagem) : null

      const isStories = post.content_type === 'stories'

      // 1. PUBLICAR NO FACEBOOK
      if (redes.facebook && isStories) {
        // Facebook Stories usa um endpoint totalmente diferente (POST
        // /{page-id}/photo_stories ou /video_stories, não /feed nem
        // /photos) e provavelmente exige permissão extra do app que ainda
        // não foi confirmada — não implementado (20/08/2026, ver
        // docs/meta-integracao.md). Registra erro claro em vez de publicar
        // errado no feed, que seria pior que não publicar nada.
        errorLog.facebook = {
          error:
            'Facebook Stories ainda não implementado — escolha Feed/Reels, ou desmarque o Facebook e publique Stories só no Instagram.',
        }
        console.error(`Post ${post.id}: Facebook Stories solicitado, mas não implementado.`)
      } else if (redes.facebook && pageId && token) {
        console.log(`Iniciando publicação do post ${post.id} no Facebook...`)
        if (!fbToken) fbToken = await obterTokenDePagina(pageId, token)
        let fbUrl = `https://graph.facebook.com/v20.0/${pageId}/feed`
        let payload: any = { access_token: fbToken, message: post.texto }

        // Se houver imagem, publica como foto, senão como post comum de texto
        if (imageUrlSanitized) {
          fbUrl = `https://graph.facebook.com/v20.0/${pageId}/photos`
          payload = {
            access_token: fbToken,
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
            // Post de texto (/feed) devolve só `id` (já no formato pageId_postId).
            // Post com imagem (/photos) devolve `id` da foto E `post_id` do post
            // no feed — `post_id` é o que forma o link público certo.
            fbPostId = fbData?.post_id || fbData?.id || null
            console.log('Publicação realizada com sucesso no Facebook! ID:', fbPostId)
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
        // Stories conectado em 20/08/2026 — o seletor "Tipo de Conteúdo"
        // já existia no formulário desde antes, mas não fazia diferença
        // nenhuma aqui. Stories aceita foto OU vídeo com media_type=STORIES.
        const mediaType = isStories ? 'STORIES' : isVideo ? 'REELS' : 'IMAGE'

        try {
          const containerBody: Record<string, any> = {
            access_token: token,
            [isVideo ? 'video_url' : 'image_url']: imageUrlSanitized,
            media_type: mediaType,
          }
          // Stories não exibe legenda via API — o Meta ignora `caption`
          // nesse caso, então nem manda, pra não sugerir que existe.
          if (!isStories) containerBody.caption = post.texto

          const containerRes = await fetch(`https://graph.facebook.com/v20.0/${igId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(containerBody),
          })
          const containerData = await containerRes.json()

          if (containerData.id) {
            let readyToPublish = true

            // Se for vídeo OU Stories, aguarda o Meta terminar de processar o
            // container antes de publicar. Achado em teste ao vivo
            // (20/08/2026): pra Stories de FOTO, media_publish devolvia
            // {success:true, media_id} normalmente, mas o Story não existia
            // de verdade (GET no media_id: "does not exist"; GET
            // /{ig-id}/stories: lista vazia) — sucesso falso do lado do
            // Meta, mesma classe de bug que já vimos no nosso próprio
            // código hoje. A documentação do Meta confirma: publicar antes
            // do container chegar em "FINISHED" pode devolver sucesso sem
            // o conteúdo ir ao ar de verdade — Stories de foto processam
            // rápido mas não são instantâneas como Feed.
            if (isVideo || isStories) {
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
                igMediaId = publishData?.id || null
                console.log('Publicação realizada com sucesso no Instagram! ID:', igMediaId)
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

      // 3. PUBLICAR NO LINKEDIN (21/08/2026)
      // Posta em nome do MEMBRO que autorizou o app em linkedin-oauth-callback
      // (escopo w_member_social, aprovado self-serve) — não da página da
      // empresa (w_organization_social exigiria produto separado com revisão
      // manual do LinkedIn). Só texto por enquanto — imagem/vídeo no LinkedIn
      // exige um fluxo de upload em 3 passos (registerUpload → upload do
      // binário → criar o share), não implementado ainda.
      let liSuccess = false
      let liPostId: string | null = null
      if (redes.linkedin) {
        const { data: li } = await supabase
          .from('linkedin_integracao')
          .select('access_token, author_urn, status')
          .limit(1)
          .single()

        if (li?.status !== 'conectado' || !li.access_token || !li.author_urn) {
          errorLog.linkedin = {
            error:
              'LinkedIn não conectado — clique em "Conectar LinkedIn" na Central de Redes Sociais.',
          }
        } else {
          try {
            const liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${li.access_token}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
              },
              body: JSON.stringify({
                author: li.author_urn,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                  'com.linkedin.ugc.ShareContent': {
                    shareCommentary: { text: post.texto },
                    shareMediaCategory: 'NONE',
                  },
                },
                visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
              }),
            })
            if (liRes.ok || liRes.status === 201) {
              liSuccess = true
              liPostId = liRes.headers.get('x-restli-id')
              console.log('Publicação realizada com sucesso no LinkedIn! ID:', liPostId)
            } else {
              errorLog.linkedin = await liRes.json().catch(() => ({ status: liRes.status }))
              console.error('Falha ao publicar no LinkedIn:', errorLog.linkedin)
            }
          } catch (e: any) {
            errorLog.linkedin = e.message
          }
        }
      }

      // 4. ATUALIZAÇÃO DE STATUS E GRAVAÇÃO DE LOGS DETALHADOS
      // O post só é dado como 'Publicado' se todas as redes solicitadas tiverem sucesso
      const requestedFb = !!redes.facebook
      const requestedIg = !!redes.instagram
      const requestedLi = !!redes.linkedin

      const fbResultOk = !requestedFb || fbSuccess
      const igResultOk = !requestedIg || igSuccess
      const liResultOk = !requestedLi || liSuccess
      const isTotalSuccess = fbResultOk && igResultOk && liResultOk

      const newStatus = isTotalSuccess ? 'Publicado' : 'Erro'

      // Rede pedida que falhou sem registrar motivo (ex.: página/token não
      // configurados, Instagram sem imagem) ganha uma explicação mesmo assim.
      if (requestedFb && !fbSuccess && !errorLog.facebook) {
        errorLog.facebook = { error: 'Facebook não configurado (página ou token ausente).' }
      }
      if (requestedIg && !igSuccess && !errorLog.instagram) {
        errorLog.instagram = {
          error: imageUrlSanitized
            ? 'Instagram não configurado (conta ou token ausente).'
            : 'O Instagram só publica com imagem ou vídeo — este post não tem.',
        }
      }

      // Grava o resultado NO POST pra tela de aprovação mostrar de verdade o
      // que aconteceu (antes o erro só ia pra logs_integracao e o post sumia
      // da lista sem aviso).
      await supabase
        .from('social_posts')
        .update({
          status: newStatus,
          erro_msg: isTotalSuccess ? null : mensagemErroAmigavel(errorLog),
          publicado_em: isTotalSuccess ? new Date().toISOString() : null,
        })
        .eq('id', post.id)

      // Achado em teste ao vivo (20/08/2026, pedido da Adriana): antes só
      // gravava detalhe quando dava erro — quando dava certo, o ID que o
      // Facebook/Instagram devolvem se perdia, sem jeito de confirmar depois
      // onde o post foi parar. Agora grava sempre (sucesso ou erro).
      const resultLog: any = {}
      if (requestedFb) {
        resultLog.facebook = fbSuccess
          ? { success: true, post_id: fbPostId, link: fbPostId ? `https://www.facebook.com/${fbPostId}` : null }
          : { success: false, error: errorLog.facebook }
      }
      if (requestedIg) {
        resultLog.instagram = igSuccess
          ? { success: true, media_id: igMediaId }
          : { success: false, error: errorLog.instagram }
      }
      if (requestedLi) {
        resultLog.linkedin = liSuccess
          ? { success: true, post_id: liPostId }
          : { success: false, error: errorLog.linkedin }
      }

      await supabase.from('logs_integracao').insert({
        portal: 'meta_social',
        status: newStatus,
        payload_erro: resultLog,
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
