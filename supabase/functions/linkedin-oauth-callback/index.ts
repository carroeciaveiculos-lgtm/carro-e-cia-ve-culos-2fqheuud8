import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Versão da API do LinkedIn no formato YYYYMM exigido no header
// LinkedIn-Version. Atualizar de tempos em tempos (LinkedIn versiona por
// mês, versões muito antigas param de responder).
const LINKEDIN_API_VERSION = '202608'

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

    // Descobre a organização (página da empresa) que esse admin gerencia —
    // melhor esforço: se a permissão aprovada não cobrir isso, o token
    // ainda é salvo, só sem o nome/URN da página (precisaria completar à
    // mão depois).
    let organizationUrn: string | null = null
    let organizationNome: string | null = null
    try {
      const aclRes = await fetch(
        'https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED',
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'LinkedIn-Version': LINKEDIN_API_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        },
      )
      const aclData = await aclRes.json()
      const primeiraOrg = aclData?.elements?.[0]?.organization
      if (primeiraOrg) {
        organizationUrn = primeiraOrg
        const orgId = String(primeiraOrg).split(':').pop()
        const orgRes = await fetch(`https://api.linkedin.com/rest/organizations/${orgId}`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'LinkedIn-Version': LINKEDIN_API_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        })
        const orgData = await orgRes.json()
        organizationNome = orgData?.localizedName || orgData?.vanityName || null
      }
    } catch (e) {
      console.error('Erro ao buscar organização administrada no LinkedIn:', e)
    }

    await supabase
      .from('linkedin_integracao')
      .update({
        status: 'conectado',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAt,
        refresh_token_expires_at: refreshExpiresAt,
        organization_urn: organizationUrn,
        organization_nome: organizationNome,
        oauth_state: null,
        ultimo_erro: null,
      })
      .eq('id', row.id)

    return paginaResposta(
      'LinkedIn conectado!',
      organizationNome
        ? `Conectado como <strong>${organizationNome}</strong>.`
        : 'Token salvo, mas não consegui identificar a página automaticamente — confirme com a equipe.',
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
