import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const { action, commentId, message, platform } = payload

    // 1. Validação de dados de entrada obrigatórios
    if (!commentId || !action) {
      return new Response(
        JSON.stringify({ error: "Os parâmetros 'commentId' e 'action' são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const pageToken = Deno.env.get('META_PAGE_ACCESS_TOKEN')!
    const isInstagram = platform === 'instagram'

    let url = `https://graph.facebook.com/v20.0/${commentId}`
    let method = 'POST'
    let reqBody: any = { access_token: pageToken }

    // 2. ROTEAMENTO DINÂMICO DE AÇÕES POR PLATAFORMA (Fator de Sucesso)
    if (action === 'like') {
      if (isInstagram) {
        // No Instagram: Curtir é feito enviando 'user_liked: true' direto no ID do comentário
        reqBody.user_liked = true
      } else {
        // No Facebook: Curtir é feito na rota /likes
        url = `https://graph.facebook.com/v20.0/${commentId}/likes`
      }
    } else if (action === 'unlike') {
      if (isInstagram) {
        reqBody.user_liked = false
      } else {
        method = 'DELETE' // No Facebook, descurtir é feito enviando um DELETE para /likes
        url = `https://graph.facebook.com/v20.0/${commentId}/likes`
      }
    } else if (action === 'reply') {
      if (isInstagram) {
        // No Instagram: Respostas a comentários devem ir para /replies
        url = `https://graph.facebook.com/v20.0/${commentId}/replies`
      } else {
        // No Facebook: Respostas vão para /comments
        url = `https://graph.facebook.com/v20.0/${commentId}/comments`
      }
      reqBody.message = message
    } else if (action === 'hide') {
      // Ocultar comentário
      if (isInstagram) {
        reqBody.hide = true
      } else {
        reqBody.is_hidden = true
      }
    } else if (action === 'unhide') {
      // Desocultar comentário
      if (isInstagram) {
        reqBody.hide = false
      } else {
        reqBody.is_hidden = false
      }
    } else if (action === 'delete') {
      // Excluir comentário definitivamente
      method = 'DELETE'
      reqBody = {} // DELETE não aceita body de parâmetros adicionais além do token na URL ou cabeçalho
    } else {
      return new Response(
        JSON.stringify({
          error: `Ação comercial '${action}' não é suportada por este microsserviço.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 3. Executar a chamada na API oficial do Meta Graph
    console.log(
      `Executando ação '${action}' via ${method} no comentário ${commentId} (${platform || 'facebook'})...`,
    )

    // Se for DELETE, passa o token de acesso como query param, senão envia no body JSON
    const fetchUrl = method === 'DELETE' ? `${url}?access_token=${pageToken}` : url
    const fetchBody = method === 'DELETE' ? undefined : JSON.stringify(reqBody)

    const res = await fetch(fetchUrl, {
      method: method,
      headers: method === 'DELETE' ? {} : { 'Content-Type': 'application/json' },
      body: fetchBody,
    })

    const data = await res.json()

    if (!res.ok) {
      console.error(`Erro retornado pelo Meta ao executar ação social:`, JSON.stringify(data))
      return new Response(
        JSON.stringify({ success: false, error: 'Meta API Error', details: data }),
        {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log(`Ação '${action}' executada com sucesso!`)
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Erro geral na função social-actions:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
