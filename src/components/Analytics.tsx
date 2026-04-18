import { useEffect } from 'react'

export function Analytics() {
  useEffect(() => {
    // Scripts nativos movidos para o index.html por performance.
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
