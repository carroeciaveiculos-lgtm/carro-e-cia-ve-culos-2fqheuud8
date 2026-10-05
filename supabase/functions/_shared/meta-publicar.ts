// Chamadas à Graph API da Meta para publicar CARROSSEL de fotos (Fase 2 da postagem
// automática, 03/10/2026; ver docs/postagem-automatica-redes.md).
//
// - Instagram: cada foto vira um "contêiner filho" (is_carousel_item), depois um contêiner
//   pai (media_type=CAROUSEL, children=ids) e então media_publish. Aceita 2 a 10 itens.
// - Facebook: cada foto é enviada SEM publicar (published=false) e um único post em /feed
//   junta todas via attached_media.
//
// Todas devolvem { ok, id?, erro? } — `erro` é a resposta crua da Meta (o publicar-social
// traduz pra português com mensagemErroAmigavel).

const GRAPH = 'https://graph.facebook.com/v20.0'
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Os nomes de arquivo do estoque trazem parênteses ("...094704(1).jpg", vindos do celular).
// Codifica antes de entregar a URL à Meta pra o download dela não tropeçar nesses caracteres.
const urlSegura = (url: string) => url.replace(/\(/g, '%28').replace(/\)/g, '%29')

export interface ResultadoMeta {
  ok: boolean
  id?: string
  erro?: unknown
}

async function postJson(url: string, corpo: Record<string, unknown>): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })
  const dados = await res.json().catch(() => ({}))
  return { ok: res.ok, dados }
}

// Espera o Instagram terminar de processar um contêiner (FINISHED). Publicar antes disso
// pode devolver "sucesso" sem o conteúdo ir ao ar (achado de 20/08/2026 nos Stories).
async function aguardarContainer(
  id: string,
  token: string,
  tentativas = 20,
  intervaloMs = 3000,
): Promise<{ ok: boolean; erro?: unknown }> {
  for (let i = 0; i < tentativas; i++) {
    const r = await fetch(
      `${GRAPH}/${id}?fields=status_code&access_token=${encodeURIComponent(token)}`,
    )
    const j = await r.json().catch(() => ({}))
    if (j.status_code === 'FINISHED') return { ok: true }
    if (j.status_code === 'ERROR' || j.status_code === 'EXPIRED') return { ok: false, erro: j }
    await esperar(intervaloMs)
  }
  return { ok: false, erro: { error: 'O Instagram não terminou de processar a mídia a tempo.' } }
}

export async function publicarCarrosselInstagram(p: {
  igId: string
  token: string
  urls: string[]
  legenda: string
}): Promise<ResultadoMeta> {
  const { igId, token, urls, legenda } = p
  if (urls.length < 2 || urls.length > 10) {
    return { ok: false, erro: { error: 'Carrossel do Instagram precisa de 2 a 10 fotos.' } }
  }

  // 1) um contêiner por foto
  const filhos: string[] = []
  for (const url of urls) {
    const r = await postJson(`${GRAPH}/${igId}/media`, {
      access_token: token,
      image_url: urlSegura(url),
      is_carousel_item: true,
    })
    if (!r.dados?.id) return { ok: false, erro: r.dados }
    filhos.push(r.dados.id)
  }
  for (const id of filhos) {
    const pronto = await aguardarContainer(id, token)
    if (!pronto.ok) return { ok: false, erro: pronto.erro }
  }

  // 2) contêiner do carrossel
  const pai = await postJson(`${GRAPH}/${igId}/media`, {
    access_token: token,
    media_type: 'CAROUSEL',
    children: filhos.join(','),
    caption: legenda,
  })
  if (!pai.dados?.id) return { ok: false, erro: pai.dados }
  const paiPronto = await aguardarContainer(pai.dados.id, token)
  if (!paiPronto.ok) return { ok: false, erro: paiPronto.erro }

  // 3) publica
  const pub = await postJson(`${GRAPH}/${igId}/media_publish`, {
    access_token: token,
    creation_id: pai.dados.id,
  })
  if (!pub.ok || !pub.dados?.id) return { ok: false, erro: pub.dados }
  return { ok: true, id: pub.dados.id }
}

export async function publicarFotosFacebook(p: {
  pageId: string
  token: string // token DA PÁGINA (ver obterTokenDePagina em publicar-social)
  urls: string[]
  mensagem: string
}): Promise<ResultadoMeta> {
  const { pageId, token, urls, mensagem } = p
  if (urls.length < 1) return { ok: false, erro: { error: 'Nenhuma foto para publicar.' } }

  // 1) envia cada foto sem publicar
  const fotos: string[] = []
  for (const url of urls) {
    const r = await postJson(`${GRAPH}/${pageId}/photos`, {
      access_token: token,
      url: urlSegura(url),
      published: false,
    })
    if (!r.dados?.id) return { ok: false, erro: r.dados }
    fotos.push(r.dados.id)
  }

  // 2) um único post com todas as fotos
  const post = await postJson(`${GRAPH}/${pageId}/feed`, {
    access_token: token,
    message: mensagem,
    attached_media: fotos.map((id) => ({ media_fbid: id })),
  })
  if (!post.ok || !post.dados?.id) return { ok: false, erro: post.dados }
  return { ok: true, id: post.dados.id }
}
