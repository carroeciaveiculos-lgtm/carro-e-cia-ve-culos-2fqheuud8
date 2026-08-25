// Conversions API for Messaging (24/08/2026, pedido da Adriana) — dataset
// separado do Pixel do site (esse aqui é ligado ao WhatsApp Business,
// carroecia_mensagens, ID 1740865157112022). Manda de volta pra Meta o que
// realmente aconteceu com um lead vindo de anúncio clique-para-WhatsApp
// (LeadSubmitted na captura, Purchase no fechamento), pro algoritmo de
// anúncio aprender a buscar gente parecida com quem compra de verdade, não
// só quem manda "oi". Estrutura de payload conferida campo a campo contra o
// Payload Helper real da conta (não adivinhada) — action_source
// 'business_messaging' + messaging_channel 'whatsapp', diferente do
// action_source 'website' usado no CAPI de Purchase do Pixel
// (meta-capi-postback).
//
// page_id: achado 24/08/2026 — o FACEBOOK_PAGE_ID já configurado no projeto
// (1419304271478565, usado por publicar-social) é uma Página DIFERENTE da
// que a tela do Payload Helper mostrava como "conta conectada"
// (150270571501412). A Adriana confirmou que 1419304271478565 é a Página
// certa — hardcoded aqui como fallback, não reaproveita FACEBOOK_PAGE_ID
// direto pra não criar acoplamento com outro uso caso um dos dois mude.

const DATASET_ID = Deno.env.get('META_MESSAGING_DATASET_ID') || '1740865157112022'
const PAGE_ID = Deno.env.get('META_MESSAGING_PAGE_ID') || '1419304271478565'
const API_BASE = 'https://graph.facebook.com/v20.0'

export async function hashSha256(valor: string): Promise<string> {
  const normalizado = valor.trim().toLowerCase()
  const dados = new TextEncoder().encode(normalizado)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dados)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function normalizarTelefone(telefone: string): string {
  // Meta exige telefone em E.164 sem "+" antes de hashear (so digitos,
  // com codigo de pais). Numeros ja chegam com 55 na frente neste projeto.
  return telefone.replace(/\D/g, '')
}

export interface EventoMensagemParams {
  eventName: 'LeadSubmitted' | 'Purchase'
  eventId: string
  telefone?: string | null
  ctwaClid?: string | null
  valor?: number | null
  moeda?: string
  testEventCode?: string
}

export async function enviarEventoMensagem(
  params: EventoMensagemParams,
): Promise<{ ok: boolean; status: number; body: any }> {
  const token = Deno.env.get('META_MESSAGING_CAPI_TOKEN') || ''
  if (!token) {
    return { ok: false, status: 0, body: { error: 'META_MESSAGING_CAPI_TOKEN nao configurado' } }
  }

  // Achado 24/08/2026, testado de verdade contra o validador da Meta antes
  // de ir pra produção: page_id NÃO é campo de topo do evento (como a
  // ordem da tela do Payload Helper sugeria) — a Meta rejeita com
  // "Falta a identificação da Página" se não estiver dentro de user_data.
  const userData: Record<string, unknown> = { page_id: PAGE_ID }
  if (params.telefone) {
    userData.ph = [await hashSha256(normalizarTelefone(params.telefone))]
  }
  if (params.ctwaClid) {
    userData.ctwa_clid = params.ctwaClid
  }

  const evento: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'business_messaging',
    messaging_channel: 'whatsapp',
    event_id: params.eventId,
    user_data: userData,
  }
  if (params.valor !== undefined && params.valor !== null) {
    evento.custom_data = { currency: params.moeda || 'BRL', value: params.valor }
  }

  const body: Record<string, unknown> = { data: [evento] }
  if (params.testEventCode) body.test_event_code = params.testEventCode

  const res = await fetch(`${API_BASE}/${DATASET_ID}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: token }),
  })
  const responseBody = await res.json()
  return { ok: res.ok, status: res.status, body: responseBody }
}
