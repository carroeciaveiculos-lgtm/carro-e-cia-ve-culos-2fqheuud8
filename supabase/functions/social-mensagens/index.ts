import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Responde uma conversa da Central de Mensagens (direct do Instagram / Messenger do Facebook).
// Chamada só pelo painel, com a equipe logada (04/10/2026). Corpo: { conversa_id, texto }.
//
// Regras da Meta que o código respeita:
//  - só dá para responder até 24 h depois da última mensagem DO CLIENTE (fora disso a API recusa);
//  - o envio usa o id da PÁGINA (FACEBOOK_PAGE_ID), não "me": o token é de usuário do sistema.

const JANELA_MS = 24 * 60 * 60 * 1000
const MAX_TEXTO = 1000 // limite do direct do Instagram

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// Erro da Meta → frase que a equipe entende
function erroAmigavel(err: any): string {
  const code = Number(err?.code)
  const sub = Number(err?.error_subcode)
  if (code === 190) return 'A conexão com a Meta expirou. Avise o suporte para renovar o token.'
  if (code === 10 || code === 200 || code === 230 || code === 803)
    return 'O app da Meta não tem permissão para enviar mensagens neste canal. Confira as permissões de mensagens do app.'
  if (sub === 2534022 || sub === 2018278 || code === 551)
    return 'Passou da janela de 24 horas ou o cliente não aceita mensagens. Responda pelo app do Instagram/Facebook.'
  if (code === 100) return 'A Meta não reconheceu este contato. A conversa pode ter sido apagada pelo cliente.'
  if (code === 4 || code === 17 || code === 32 || code === 613)
    return 'Limite de envios da Meta atingido. Tente de novo em alguns minutos.'
  return 'A Meta recusou o envio da mensagem.'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    // verify_jwt=true também aceita a chave pública (anon). Aqui exige um usuário logado de verdade.
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: u, error: erroAuth } = await admin.auth.getUser(jwt)
    if (erroAuth || !u?.user) return json({ error: 'Sessão expirada. Entre no painel de novo.' }, 401)

    const { conversa_id, texto } = await req.json()
    const mensagem = String(texto ?? '').trim()
    if (!conversa_id || !mensagem) return json({ error: 'Escreva a mensagem antes de enviar.' }, 400)
    if (mensagem.length > MAX_TEXTO)
      return json({ error: `A mensagem passou de ${MAX_TEXTO} caracteres.` }, 400)

    const { data: conversa } = await admin
      .from('social_conversas')
      .select('id, plataforma, contato_id, ultima_do_cliente_em')
      .eq('id', conversa_id)
      .maybeSingle()
    if (!conversa) return json({ error: 'Conversa não encontrada.' }, 404)

    const ultima = conversa.ultima_do_cliente_em ? new Date(conversa.ultima_do_cliente_em).getTime() : 0
    if (!ultima || Date.now() - ultima > JANELA_MS) {
      return json(
        {
          error:
            'Passaram mais de 24 horas desde a última mensagem do cliente: a Meta não permite responder por aqui. Responda pelo app do Instagram ou do Facebook.',
          codigo: 'fora_da_janela',
        },
        409,
      )
    }

    const token = Deno.env.get('META_PAGE_ACCESS_TOKEN')
    const paginaId = Deno.env.get('FACEBOOK_PAGE_ID')
    if (!token || !paginaId) return json({ error: 'A conexão com a Meta não está configurada.' }, 500)

    const corpoMeta: Record<string, unknown> = {
      recipient: { id: conversa.contato_id },
      message: { text: mensagem },
    }
    // Messenger exige informar o tipo da mensagem; no Instagram não se usa.
    if (conversa.plataforma === 'facebook') corpoMeta.messaging_type = 'RESPONSE'

    const r = await fetch(`https://graph.facebook.com/v20.0/${paginaId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpoMeta),
      signal: AbortSignal.timeout(15000),
    })
    const resp = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('Meta recusou o envio:', JSON.stringify(resp?.error ?? resp))
      return json({ error: erroAmigavel(resp?.error), detalhe: resp?.error?.message ?? null }, 502)
    }

    // Guarda a resposta na conversa. O "eco" que a Meta manda depois com o mesmo id não duplica
    // (a tabela é única por mid).
    const agora = new Date().toISOString()
    const { error: erroMsg } = await admin.from('social_mensagens').insert({
      conversa_id: conversa.id,
      direcao: 'saida',
      origem: 'painel',
      texto: mensagem,
      mid: resp?.message_id ?? null,
      criado_em: agora,
    })
    if (erroMsg && erroMsg.code !== '23505') console.error('Falha ao guardar a resposta enviada:', erroMsg)
    await admin
      .from('social_conversas')
      .update({ ultima_mensagem: mensagem.slice(0, 300), ultima_mensagem_em: agora, nao_lidas: 0 })
      .eq('id', conversa.id)

    return json({ success: true, message_id: resp?.message_id ?? null })
  } catch (e) {
    console.error('Erro em social-mensagens:', e)
    return json({ error: 'Erro inesperado ao enviar a mensagem.' }, 500)
  }
})
