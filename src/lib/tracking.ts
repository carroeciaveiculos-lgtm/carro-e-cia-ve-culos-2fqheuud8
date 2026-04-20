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
