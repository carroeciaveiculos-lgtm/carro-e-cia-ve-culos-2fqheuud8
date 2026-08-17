// Rastreio de origem de anúncio (17/08/2026, pedido da Adriana). A conta de
// Google Ads tem "marcação automática" ativada (confirmado direto na API) —
// o Google acrescenta `gclid` na URL em vez de UTM manual. Os anúncios hoje
// levam pra home do site, então quem preenche um formulário pode já ter
// navegado pra outra página (o parâmetro some da URL ao trocar de rota no
// React Router) — por isso captura uma vez, na primeira página que abrir
// com o parâmetro, e guarda em localStorage pra qualquer formulário usar
// depois, mesmo em outra página.
const STORAGE_KEY = 'cec_ad_attribution'
const VALIDADE_DIAS = 30

interface AtribuicaoAnuncio {
  gclid?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  capturado_em: string
}

export function capturarAtribuicaoAnuncio(): void {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const gclid = params.get('gclid') || undefined
    const utm_source = params.get('utm_source') || undefined
    const utm_medium = params.get('utm_medium') || undefined
    const utm_campaign = params.get('utm_campaign') || undefined

    if (!gclid && !utm_source && !utm_campaign) return

    const dado: AtribuicaoAnuncio = {
      gclid,
      utm_source,
      utm_medium,
      utm_campaign,
      capturado_em: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dado))
  } catch {
    // localStorage indisponível (modo privado, cookies bloqueados etc.) —
    // sem rastreio nesse caso, não é motivo pra quebrar a navegação.
  }
}

export function obterAtribuicaoAnuncio(): Partial<AtribuicaoAnuncio> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const dado: AtribuicaoAnuncio = JSON.parse(raw)
    const idadeMs = Date.now() - new Date(dado.capturado_em).getTime()
    if (idadeMs > VALIDADE_DIAS * 24 * 60 * 60 * 1000) return {}
    return dado
  } catch {
    return {}
  }
}
