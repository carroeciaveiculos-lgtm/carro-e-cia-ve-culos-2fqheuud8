import { useEffect } from 'react'

// "App" do painel na tela de início do celular (17/09/2026; ampliado em
// 24/11/2026). O site público e o /admin dividem o mesmo index.html, então
// manifesto, ícone do iPhone e service worker NÃO podem ficar fixos nele
// (ofereceria "instalar app" pro visitante do site). São colocados só
// enquanto uma tela do painel está aberta e retirados ao sair.
//
// Usado no AdminLayout (painel logado) E na tela de login: no iPhone, quem
// toca em "Adicionar à Tela de Início" costuma estar na tela de login, e
// sem o apple-touch-icon o Safari usa uma foto da página como ícone.
export function usePainelPWA() {
  useEffect(() => {
    const criados: HTMLElement[] = []
    const adicionar = (el: HTMLElement) => {
      document.head.appendChild(el)
      criados.push(el)
    }

    const manifest = document.createElement('link')
    manifest.rel = 'manifest'
    manifest.href = '/admin-manifest.json'
    adicionar(manifest)

    // iPhone/iPad ignoram os ícones do manifesto: leem só este link.
    // PNG 180x180, fundo branco sem transparência (o iOS pinta de preto).
    const appleIcon = document.createElement('link')
    appleIcon.rel = 'apple-touch-icon'
    appleIcon.setAttribute('sizes', '180x180')
    appleIcon.href = '/painel-icone-180.png'
    adicionar(appleIcon)

    const metas: Record<string, string> = {
      'apple-mobile-web-app-capable': 'yes',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-title': 'Carro e Cia CRM',
      'theme-color': '#0f172a',
    }
    for (const [name, content] of Object.entries(metas)) {
      const meta = document.createElement('meta')
      meta.name = name
      meta.content = content
      adicionar(meta)
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin/' }).catch(() => {
        // Não crítico — sem SW o painel continua funcionando normalmente,
        // só perde a opção de instalar em navegadores mais exigentes.
      })
    }

    return () => {
      for (const el of criados) el.remove()
    }
  }, [])
}
