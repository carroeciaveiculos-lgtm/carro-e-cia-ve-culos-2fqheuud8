export const trackConversion = (type: 'whatsapp' | 'ligar' | 'formulario') => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const codes = {
      whatsapp: 'AW-18085065720/whatsapp_click',
      ligar: 'AW-18085065720/ligar_click',
      formulario: 'AW-18085065720/form_submit',
    }
    ;(window as any).gtag('event', 'conversion', {
      send_to: codes[type],
    })
  }
}

export const trackGTMEvent = (eventName: string, data: Record<string, any> = {}) => {
  if (typeof window !== 'undefined') {
    const w = window as any
    w.dataLayer = w.dataLayer || []
    w.dataLayer.push({
      event: eventName,
      ...data,
    })
  }
}

declare global {
  interface Window {
    dataLayer: any[]
    gtag?: any
  }
}
