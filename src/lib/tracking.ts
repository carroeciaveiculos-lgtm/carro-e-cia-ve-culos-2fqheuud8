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

export const trackMetaEvent = (eventName: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    if (data) {
      ;(window as any).fbq('track', eventName, data)
    } else {
      ;(window as any).fbq('track', eventName)
    }
  }
}

// Mantenho legacy trackConversion para retrocompatibilidade onde não atualizado
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
  if (type === 'whatsapp') {
    trackWhatsAppClick('Luiz', 'legacy_button')
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
  trackGTMEvent('formulario_interesse_enviado', {
    vehicle_name: vehicleName,
    form_type: formType,
  })
  trackMetaEvent('Contact')

  // Disparo pro Google Ads também
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'conversion', { send_to: 'AW-18085065720/form_submit' })
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
