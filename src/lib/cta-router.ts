import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackCTAClick, trackWhatsAppClick } from '@/lib/tracking'

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export const sanitizeText = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/\uFEFF/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã£/g, 'ã')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‚/g, 'Â')
    .replace(/â€"/g, '—')
    .replace(/â€"/g, '–')
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export const getVehicleUrl = (vehicle: any) => {
  if (!vehicle) return 'https://www.carroeciamotors.com.br/estoque'
  const slug = vehicle.slug || vehicle.id
  return `https://www.carroeciamotors.com.br/estoque/${slug}`
}

export const getShareUrl = (vehicle: any) => {
  if (!vehicle) return 'https://www.carroeciamotors.com.br/estoque'
  const slug = vehicle.slug || vehicle.id
  return `https://www.carroeciamotors.com.br/s/${slug}`
}

export const getVehicleDescription = (vehicle: any): string => {
  if (!vehicle) return ''
  if (vehicle.descricao && vehicle.descricao.trim()) {
    return sanitizeText(vehicle.descricao.trim())
  }
  const name = `${vehicle.marca} ${vehicle.modelo}`.trim()
  const ano = vehicle.ano_fabricacao || vehicle.ano_modelo || ''
  const km = vehicle.quilometragem
    ? `, ${Number(vehicle.quilometragem).toLocaleString('pt-BR')} km`
    : ''
  const fuel = vehicle.combustivel ? `, ${vehicle.combustivel}` : ''
  const cambio = vehicle.cambio ? `, câmbio ${vehicle.cambio}` : ''
  const cor = vehicle.cor ? `, cor ${vehicle.cor}` : ''
  return sanitizeText(
    `Excelente ${name} ${ano}${km}${fuel}${cambio}${cor}. Veículo em ótimo estado. Financiamos e aceitamos troca. Entre em contato para mais detalhes.`,
  )
}

export const getVehicleDiferenciais = (vehicle: any): string[] => {
  if (
    vehicle?.diferenciais &&
    Array.isArray(vehicle.diferenciais) &&
    vehicle.diferenciais.length > 0
  ) {
    return vehicle.diferenciais
  }
  if (
    vehicle?.caracteristicas &&
    Array.isArray(vehicle.caracteristicas) &&
    vehicle.caracteristicas.length > 0
  ) {
    return vehicle.caracteristicas
  }
  const basic: string[] = []
  if (vehicle?.ano_fabricacao)
    basic.push(`${vehicle.ano_fabricacao}/${vehicle.ano_modelo || vehicle.ano_fabricacao}`)
  if (vehicle?.combustivel) basic.push(vehicle.combustivel)
  if (vehicle?.cambio) basic.push(`Câmbio ${vehicle.cambio}`)
  if (vehicle?.cor) basic.push(vehicle.cor)
  if (vehicle?.ipva_pago) basic.push('IPVA Pago')
  return basic
}

export const getShareText = (vehicle: any) => {
  if (!vehicle) return ''
  const price = formatCurrency(vehicle.preco_venda || 0)
  const km = vehicle.quilometragem
    ? `${vehicle.quilometragem.toLocaleString('pt-BR')} km`
    : 'Excelente km'
  const ano = `${vehicle.ano_fabricacao}/${vehicle.ano_modelo}`
  const name = `${vehicle.marca} ${vehicle.modelo} ${vehicle.versao || ''}`.trim()
  const url = getShareUrl(vehicle)
  return sanitizeText(
    `${name} | Ano: ${ano} | KM: ${km} | Preço: ${price}. Venda ou Compre seu carro rápido e seguro. ${url}`,
  )
}

export const getCommercialText = (
  vehicle: any,
  isSimulacao = false,
  simDetails?: { entrada: string; parcelas: string },
) => {
  if (!vehicle) return 'Olá! Gostaria de mais informações.'
  const name = `${vehicle.marca} ${vehicle.modelo} ${vehicle.versao || ''}`.trim()
  if (isSimulacao && simDetails) {
    return sanitizeText(
      `Olá! Tenho interesse em simular o financiamento do ${name} (${vehicle.ano_fabricacao}).\n\n💰 Valor: ${formatCurrency(vehicle.preco_venda || 0)}\n💵 Entrada: R$ ${simDetails.entrada || '0'}\n📅 Parcelas: ${simDetails.parcelas}x`,
    )
  }
  return sanitizeText(
    `🚗 *Oportunidade Imperdível!*\n\nOlá! Tenho interesse no veículo:\n*${name}*\n📅 Ano: ${vehicle.ano_fabricacao}/${vehicle.ano_modelo}\n🛣️ KM: ${vehicle.quilometragem ? vehicle.quilometragem.toLocaleString('pt-BR') : 'Excelente km'}\n💰 Valor: ${formatCurrency(vehicle.preco_venda || 0)}`,
  )
}

export const handleShareCTA = async (vehicle: any, source: string) => {
  if (!vehicle) return false
  const shareText = getShareText(vehicle)
  const shareUrl = getShareUrl(vehicle)
  trackCTAClick('Compartilhar Veículo', source)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${vehicle.marca} ${vehicle.modelo}`,
        text: shareText,
        url: shareUrl,
      })
      return true
    } catch (err) {
      console.error('Error sharing', err)
      return false
    }
  } else {
    navigator.clipboard.writeText(shareText)
    return false
  }
}

export const handleCommercialCTA = async ({
  vehicle,
  ctaType,
  source,
  isSimulacao = false,
  simDetails,
}: {
  vehicle?: any
  ctaType: string
  source: string
  isSimulacao?: boolean
  simDetails?: { entrada: string; parcelas: string }
}): Promise<{ success: boolean }> => {
  // Achado 17/08/2026: criar o lead aqui, antes de a pessoa realmente
  // mandar a mensagem no WhatsApp, gerava um lead fantasma ("Lead
  // Interessado", sem telefone) — a Clara já mandava uma saudação nele
  // sem ter pra quem entregar. Quando a mensagem de verdade chegava, o
  // sistema não tinha telefone pra cruzar e criava outro lead, separado,
  // pra conversa real — o fantasma ficava órfão no CRM, parecendo uma
  // conversa "quebrada". O fluxo de entrada real do WhatsApp
  // (`receive-leads`) já cria o lead certo, com telefone, no momento em
  // que a mensagem chega — não precisa duplicar aqui.

  trackWhatsAppClick('Luiz', ctaType, vehicle?.id)
  trackCTAClick(ctaType, source)

  const message = getCommercialText(vehicle, isSimulacao, simDetails)
  const whatsappUrl = getWhatsAppLink(message)

  // Navigate using location.href to avoid popup blockers and ensure robust delivery
  if (typeof window !== 'undefined') {
    window.location.href = whatsappUrl
  }

  return { success: true }
}
