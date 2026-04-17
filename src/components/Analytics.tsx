import { useEffect } from 'react'

export function Analytics() {
  useEffect(() => {
    if (!document.getElementById('ga4-script')) {
      const script1 = document.createElement('script')
      script1.id = 'ga4-script'
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-7NCHPJ2SLT'}`
      script1.async = true
      document.head.appendChild(script1)

      const script2 = document.createElement('script')
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-7NCHPJ2SLT'}');
      `
      document.head.appendChild(script2)
    }

    if (!document.getElementById('clarity-script')) {
      const script4 = document.createElement('script')
      script4.id = 'clarity-script'
      script4.innerHTML = `
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${import.meta.env.VITE_CLARITY_ID || 'wb6vgqmca2'}");
      `
      document.head.appendChild(script4)
    }

    // Listener global para rastrear cliques em elementos com data-event
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const eventElement = target.closest('[data-event]')

      // Se for um formulário, ignoramos no clique pois o submit fará o rastreio
      if (eventElement && eventElement.tagName !== 'FORM') {
        const eventName = eventElement.getAttribute('data-event')
        if (eventName && (window as any).gtag) {
          ;(window as any).gtag('event', `${eventName}_clique`, {
            event_category: 'engajamento',
            event_label: `botao_${eventName}`,
            value: 1,
          })
        }
      }
    }

    // Listener global para rastrear envios de formulários com data-event
    const handleGlobalSubmit = (e: SubmitEvent) => {
      const target = e.target as HTMLFormElement
      const formName = target.getAttribute('data-event') || 'formulario_generico'

      if ((window as any).gtag) {
        ;(window as any).gtag('event', 'formulario_enviado', {
          event_category: 'conversao',
          event_label: formName,
          value: 1,
        })
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
