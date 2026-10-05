// Conferência da assinatura dos webhooks da Meta (04/10/2026).
// A Meta assina o CORPO EXATO de cada POST com HMAC-SHA256 usando o "App Secret" do app e manda o
// resultado no cabeçalho `X-Hub-Signature-256: sha256=<hex>`. Sem conferir isso, qualquer pessoa que
// conheça a URL do webhook pode injetar eventos falsos (criar mensagem, disparar aviso no WhatsApp).
//
// IMPORTANTE: a conta é feita sobre o texto bruto recebido, ANTES de qualquer JSON.parse — reescrever
// o JSON muda espaços/ordem e a assinatura deixa de bater.

export type ResultadoAssinatura = {
  ok: boolean
  motivo: 'ok' | 'sem_segredo' | 'sem_cabecalho' | 'formato_invalido' | 'diferente'
}

const encoder = new TextEncoder()

const paraHex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

// Comparação em tempo constante (não vaza, pelo tempo de resposta, quantos caracteres batem).
const iguaisEmTempoConstante = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function assinaturaMetaValida(
  corpoBruto: string,
  cabecalho: string | null,
  segredo: string | undefined,
): Promise<ResultadoAssinatura> {
  if (!segredo) return { ok: false, motivo: 'sem_segredo' }
  if (!cabecalho) return { ok: false, motivo: 'sem_cabecalho' }
  const m = /^sha256=([0-9a-f]{64})$/i.exec(cabecalho.trim())
  if (!m) return { ok: false, motivo: 'formato_invalido' }

  const chave = await crypto.subtle.importKey(
    'raw',
    encoder.encode(segredo),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const esperado = paraHex(await crypto.subtle.sign('HMAC', chave, encoder.encode(corpoBruto)))
  return iguaisEmTempoConstante(esperado, m[1].toLowerCase())
    ? { ok: true, motivo: 'ok' }
    : { ok: false, motivo: 'diferente' }
}

// Mais de um app da Meta pode postar no mesmo webhook (ex.: o app do Facebook/Instagram e o app do
// WhatsApp têm App Secrets diferentes — achado de 04/10/2026: eventos reais de WhatsApp NÃO batiam com
// META_APP_SECRET). Aceita se QUALQUER um dos segredos bater e diz qual (posição na lista), para
// diagnosticar sem expor o valor.
export async function assinaturaMetaValidaComVarios(
  corpoBruto: string,
  cabecalho: string | null,
  segredos: (string | undefined)[],
): Promise<ResultadoAssinatura & { segredoIndice: number | null }> {
  const validos = segredos.filter((x): x is string => !!x)
  if (validos.length === 0) return { ok: false, motivo: 'sem_segredo', segredoIndice: null }
  let ultimo: ResultadoAssinatura = { ok: false, motivo: 'diferente' }
  for (let i = 0; i < validos.length; i++) {
    const r = await assinaturaMetaValida(corpoBruto, cabecalho, validos[i])
    if (r.ok) return { ...r, segredoIndice: i }
    ultimo = r
  }
  return { ...ultimo, segredoIndice: null }
}
