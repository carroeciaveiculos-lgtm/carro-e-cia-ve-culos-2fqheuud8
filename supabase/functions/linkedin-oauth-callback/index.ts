import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

function paginaResposta(titulo: string, mensagem: string, ok: boolean): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${titulo}</title></head>
<body style="font-family: sans-serif; text-align: center; padding-top: 80px; color: #1e293b;">
  <h2>${ok ? '✅' : '❌'} ${titulo}</h2>
  <p>${mensagem}</p>
  <p style="color: #64748b; font-size: 14px;">Pode fechar esta aba.</p>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

// Recebe o redirect do LinkedIn depois da Adriana autorizar o app como admin
// da página da empresa (21/08/2026). Troca o `code` por access_token,
// tenta descobrir a organização (página) administrada e salva tudo em
// `linkedin_integracao`. Endpoint público de propósito (o LinkedIn chama
// direto, sem sessão Supabase) — a proteção é o `state` conferido contra o
// que `linkedin-oauth-start` gravou.
Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const erroParam = url.searchParams.get('error')
  const erroDescricao = url.searchParams.get('error_description')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: row } = await supabase
    .from('linkedin_integracao')
    .select('id, oauth_state')
    .limit(1)
    .single()

  if (erroParam) {
    if (row) {
      await supabase
        .from('linkedin_integracao')
        .update({ status: 'erro', ultimo_erro: `${erroParam}: ${erroDescricao}` })
        .eq('id', row.id)
    }
    return paginaResposta(
      'Conexão recusada',
      erroDescricao || erroParam || 'O LinkedIn recusou a autorização.',
      false,
    )
  }

  if (!code || !state || !row || state !== row.oauth_state) {
    return paginaResposta(
      'Link inválido ou expirado',
      'Peça pra Adriana gerar um novo link de conexão no painel.',
      false,
    )
  }

  const clientId = Deno.env.get('LINKEDIN_CLIENT_ID')!
  const clientSecret = Deno.env.get('LINKEDIN_SECRET_KEY')!
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/linkedin-oauth-callback`

  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      await supabase
        .from('linkedin_integracao')
        .update({ status: 'erro', ultimo_erro: JSON.stringify(tokenData), oauth_state: null })
        .eq('id', row.id)
      return paginaResposta(
        'Falha ao trocar o código por token',
        tokenData.error_description || 'O LinkedIn não confirmou o código recebido.',
        false,
      )
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    const refreshExpiresAt = tokenData.refresh_token_expires_in
      ? new Date(Date.now() + tokenData.refresh_token_expires_in * 1000).toISOString()
      : null

    // Identifica o membro autenticado via OpenID Connect (escopo aprovado
    // de fato: w_member_social posta EM NOME DESSE MEMBRO, não da página
    // da empresa — ver comentário em linkedin-oauth-start). O `sub` do
    // userinfo é o id que forma a Person URN usada como `author` ao
    // publicar.
    let authorUrn: string | null = null
    let authorNome: string | null = null
    try {
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const userData = await userRes.json()
      if (userData?.sub) {
        authorUrn = `urn:li:person:${userData.sub}`
        authorNome = userData.name || null
      }
    } catch (e) {
      console.error('Erro ao buscar userinfo do LinkedIn:', e)
    }

    await supabase
      .from('linkedin_integracao')
      .update({
        status: 'conectado',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAt,
        refresh_token_expires_at: refreshExpiresAt,
        author_urn: authorUrn,
        author_nome: authorNome,
        oauth_state: null,
        ultimo_erro: null,
      })
      .eq('id', row.id)

    return paginaResposta(
      'LinkedIn conectado!',
      authorNome
        ? `Conectado como <strong>${authorNome}</strong> — os posts vão sair em nome desse perfil, não como página da empresa (isso exigiria um produto separado, com revisão do LinkedIn).`
        : 'Token salvo, mas não consegui identificar o membro automaticamente — confirme com a equipe.',
      true,
    )
  } catch (err: any) {
    await supabase
      .from('linkedin_integracao')
      .update({ status: 'erro', ultimo_erro: err.message, oauth_state: null })
      .eq('id', row.id)
    return paginaResposta('Erro inesperado', err.message, false)
  }
})
