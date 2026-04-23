// Fix global para suprimir falhas de rede em integrações de tracking (AdBlockers/CORS)
// impedindo que quebrem a UI no ambiente de preview ou gerem erros no console
if (typeof window !== 'undefined') {
  const isPreview = window.location.hostname.includes('goskip.app')

  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    const url =
      typeof args[0] === 'string' ? args[0] : args[0] && 'url' in args[0] ? args[0].url : ''
    const isTracker =
      url &&
      typeof url === 'string' &&
      (url.includes('google.com/measurement') ||
        url.includes('google-analytics.com') ||
        url.includes('analytics.google.com') ||
        url.includes('facebook.com/tr') ||
        url.includes('googleadservices.com'))

    if (isTracker) {
      if (isPreview || !navigator.onLine) {
        return new Response(JSON.stringify({ success: true }), { status: 200, statusText: 'OK' })
      }
      try {
        const response = await originalFetch.apply(this, args)
        if (!response.ok || response.status === 0) {
          return new Response(JSON.stringify({ success: true }), { status: 200, statusText: 'OK' })
        }
        return response
      } catch (e) {
        console.debug('Tracking fetch silently failed')
        return new Response(JSON.stringify({ success: true }), { status: 200, statusText: 'OK' })
      }
    }
    return originalFetch.apply(this, args)
  }

  const originalSendBeacon = navigator.sendBeacon
  if (navigator.sendBeacon) {
    navigator.sendBeacon = function (url, data) {
      const isTracker =
        typeof url === 'string' &&
        (url.includes('google.com/measurement') ||
          url.includes('google-analytics.com') ||
          url.includes('analytics.google.com') ||
          url.includes('facebook.com/tr') ||
          url.includes('googleadservices.com'))

      if (isTracker) {
        if (isPreview || !navigator.onLine) return true
        try {
          return originalSendBeacon.call(this, url, data)
        } catch (e) {
          console.debug('Tracking beacon silently failed')
          return true
        }
      }
      return originalSendBeacon.call(this, url, data)
    }
  }
}

export const trackGTMEvent = (eventName: string, data: Record<string, any> = {}) => {
  if (typeof window !== 'undefined') {
    try {
      const w = window as any
      w.dataLayer = w.dataLayer || []
      w.dataLayer.push({
        event: eventName,
        ...data,
      })
    } catch (e) {
      // Falha tratada silenciosamente para evitar quebra de fluxo
      console.debug('GTM event tracking silently failed')
    }
  }
}

export const trackMetaEvent = (eventName: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    try {
      if (data) {
        ;(window as any).fbq('track', eventName, data)
      } else {
        ;(window as any).fbq('track', eventName)
      }
    } catch (e) {
      console.debug('Meta event tracking silently failed')
    }
  }
}

// Mantenho legacy trackConversion para retrocompatibilidade onde não atualizado
export const trackConversion = (type: 'whatsapp' | 'ligar' | 'formulario') => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    try {
      const codes = {
        whatsapp: 'AW-18085065720/whatsapp_click',
        ligar: 'AW-18085065720/ligar_click',
        formulario: 'AW-18085065720/form_submit',
      }
      ;(window as any).gtag('event', 'conversion', {
        send_to: codes[type],
      })
    } catch (e) {
      console.debug('Google Ads conversion tracking silently failed')
    }
  }
  if (type === 'whatsapp') {
    try {
      trackWhatsAppClick('Luiz', 'legacy_button')
    } catch (e) {
      console.debug('WhatsApp click tracking silently failed')
    }
  }
}

// Novos Eventos Estruturados GA4 + Meta Pixel

export const trackWhatsAppClick = (contactPerson: string, trigger: string) => {
  trackGTMEvent('whatsapp_click', {
    contact_person: contactPerson,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    page_title: typeof document !== 'undefined' ? document.title : '',
    trigger: trigger,
  })
  trackMetaEvent('Lead', {
    content_name: 'WhatsApp Click',
    content_category: 'Contato',
  })
}

export const trackVehicleView = (
  vehicleName: string,
  vehiclePrice: number,
  vehicleCategory: string = 'Carro',
) => {
  trackGTMEvent('estoque_veiculo_view', {
    vehicle_name: vehicleName,
    vehicle_price: vehiclePrice,
    vehicle_category: vehicleCategory,
  })
  trackMetaEvent('ViewContent', {
    content_name: vehicleName,
    content_category: 'Veículo',
    value: vehiclePrice,
    currency: 'BRL',
  })
}

export const trackSimulation = (
  vehicleValue: number,
  entryPercent: number,
  installments: string,
) => {
  trackGTMEvent('simulacao_financiamento_uso', {
    vehicle_value: vehicleValue,
    entry_percent: entryPercent,
    installments: installments,
  })
}

export const trackFormSubmission = (vehicleName: string, formType: string) => {
  try {
    trackGTMEvent('formulario_interesse_enviado', {
      vehicle_name: vehicleName,
      form_type: formType,
    })
    trackMetaEvent('Contact')

    // Disparo pro Google Ads também
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'conversion', { send_to: 'AW-18085065720/form_submit' })
    }
  } catch (e) {
    console.debug('Google Ads form conversion tracking silently failed')
  }
}

export const trackInsuranceQuote = (contactPerson: string) => {
  trackGTMEvent('cotacao_seguro_click', {
    contact_person: contactPerson,
    origin_page: typeof window !== 'undefined' ? window.location.href : '',
  })
}

declare global {
  interface Window {
    dataLayer: any[]
    gtag?: any
    fbq?: any
  }
}
