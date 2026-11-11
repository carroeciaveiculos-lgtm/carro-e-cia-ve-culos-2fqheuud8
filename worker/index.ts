// "Porteiro" do site (11/11/2026). A Cloudflare só chama este código quando o arquivo pedido NÃO
// existe e o pedido não é a abertura de uma página (Sec-Fetch-Mode diferente de navigate) — os
// arquivos que existem continuam saindo direto, sem passar por aqui.
//
// Por quê: sem ele, um pedido de /assets/<arquivo-que-não-existe>.js recebia o index.html com
// "200 OK" e, por causa do _headers, "guarde por 1 ano, immutable". Um iPhone que pedisse uma peça
// do sistema no meio de um deploy guardava a página no lugar do código e o painel travava
// ("Importing a module script failed"). Agora responde 404 sem cache, e o lazyWithRetry do App.tsx
// consegue recarregar a versão nova.

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/assets/')) {
      return new Response('Arquivo não encontrado', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }
    // Qualquer outro caso continua exatamente como antes (página do site / SPA).
    return env.ASSETS.fetch(request)
  },
}
