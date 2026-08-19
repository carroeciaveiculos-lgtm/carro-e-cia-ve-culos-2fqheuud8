import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export function normalizarNapista(s: string | null | undefined): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

// Achado testando ao vivo (14/08/2026, Jeep Compass "PRETA"): os nomes de cor
// do NaPista vêm no masculino ("Preto", "Branco", "Vermelho"...), mas
// veiculos.cor é escrito no feminino, concordando com "cor" ("Preta",
// "Branca"...) — match exato falhava pra quase todo veículo. Mesma ideia do
// ML_COLOR_MAP em ml-client.ts: fallback só usado se o match exato falhar
// primeiro, nunca substitui um match exato real.
const NAPISTA_COR_FALLBACK: Record<string, string> = {
  preta: 'preto',
  branca: 'branco',
  vermelha: 'vermelho',
  amarela: 'amarelo',
  dourada: 'dourado',
  prateada: 'prata',
  roxa: 'roxo',
  grafite: 'cinza',
  indefinida: 'indefinido',
}

export function matchAtributoNapista(
  itens: Array<{ id: string; name: string }> | undefined,
  valor: string | null | undefined,
): string | null {
  if (!itens || !valor) return null
  const alvo = normalizarNapista(valor)
  if (!alvo) return null
  const exato = itens.find((i) => normalizarNapista(i.name) === alvo)
  if (exato) return exato.id
  const fallbackAlvo = NAPISTA_COR_FALLBACK[alvo]
  if (!fallbackAlvo) return null
  return itens.find((i) => normalizarNapista(i.name) === fallbackAlvo)?.id ?? null
}

// Produção desde 18/08/2026 — client_id "carro-e-cia" liberado em produção
// pelo NaPista (ver docs/integracao-napista.md).
const NAPISTA_TOKEN_URL =
  Deno.env.get('NAPISTA_TOKEN_URL') ||
  'https://auth.napista.com.br/realms/marketplace-dealer/protocol/openid-connect/token'

export async function getValidNapistaToken(
  supabase: SupabaseClient,
): Promise<{ token: string | null; sellerId: string | null; error: string | null }> {
  const { data: cred, error } = await supabase
    .from('napista_credentials')
    .select('access_token, refresh_token, expires_at, seller_id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !cred) {
    return { token: null, sellerId: null, error: 'Sem credenciais do NaPista. Autentique primeiro em /napista-auth.' }
  }

  const now = new Date()
  const expires = new Date(cred.expires_at)
  const buffer = 5 * 60 * 1000

  if (expires.getTime() - now.getTime() > buffer) {
    return { token: cred.access_token, sellerId: cred.seller_id, error: null }
  }

  const clientId = Deno.env.get('NAPISTA_ID')!

  const res = await fetch(NAPISTA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: cred.refresh_token,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return { token: null, sellerId: null, error: `Falha ao renovar token do NaPista: ${errText}` }
  }

  const tokenData = await res.json()
  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  await supabase
    .from('napista_credentials')
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('access_token', cred.access_token)

  return { token: tokenData.access_token, sellerId: cred.seller_id, error: null }
}
