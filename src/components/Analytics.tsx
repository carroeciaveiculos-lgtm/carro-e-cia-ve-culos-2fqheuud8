import { useEffect } from 'react'

export function Analytics() {
  useEffect(() => {
    // Instalação Global da Tag do Google Ads (AW-18085065720)
    if (!document.getElementById('google-ads-tag')) {
      const script1 = document.createElement('script')
      script1.id = 'google-ads-tag'
      script1.async = true
      script1.src = 'https://www.googletagmanager.com/gtag/js?id=AW-18085065720'
      document.head.appendChild(script1)

      const script2 = document.createElement('script')
      script2.id = 'google-ads-init'
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'AW-18085065720');
      `
      document.head.appendChild(script2)
    }

    // Scripts nativos movidos para o index.html por performance.
    // Listener global para rastrear cliques em elementos com data-event
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const eventElement = target.closest('[data-event]')

      // Se for um formulário, ignoramos no clique pois o submit fará o rastreio
      if (eventElement && eventElement.tagName !== 'FORM') {
        const eventName = eventElement.getAttribute('data-event')
        if (eventName && (window as any).gtag) {
          const sendEvent = () => {
            ;(window as any).gtag('event', `${eventName}_clique`, {
              event_category: 'engajamento',
              event_label: `botao_${eventName}`,
              value: 1,
            })
          }
          if ('requestIdleCallback' in window) {
            ;(window as any).requestIdleCallback(sendEvent)
          } else {
            setTimeout(sendEvent, 0)
          }
        }
      }
    }

    // Listener global para rastrear envios de formulários com data-event
    const handleGlobalSubmit = (e: SubmitEvent) => {
      const target = e.target as HTMLFormElement
      const formName = target.getAttribute('data-event') || 'formulario_generico'

      if ((window as any).gtag) {
        const sendSubmitEvent = () => {
          ;(window as any).gtag('event', 'formulario_enviado', {
            event_category: 'conversao',
            event_label: formName,
            value: 1,
          })
        }
        if ('requestIdleCallback' in window) {
          ;(window as any).requestIdleCallback(sendSubmitEvent)
        } else {
          setTimeout(sendSubmitEvent, 0)
        }
      }
    }

    document.addEventListener('click', handleGlobalClick)
    document.addEventListener('submit', handleGlobalSubmit)

    return () => {
      document.removeEventListener('click', handleGlobalClick)
      document.removeEventListener('submit', handleGlobalSubmit)
    }
  }, [])

  return null
}
