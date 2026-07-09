import { createLead } from '@/services/leads'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackCTAClick, trackWhatsAppClick } from '@/lib/tracking'

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

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
  if (vehicle.descricao && vehicle.descricao.trim()) return vehicle.descricao
  const name = `${vehicle.marca} ${vehicle.modelo}`
  const ano = vehicle.ano_fabricacao || vehicle.ano_modelo || ''
  return `Confira este ${name} ${ano} em excelente estado. Entre em contato para mais detalhes e ficha técnica completa.`
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

  return `${name} | Ano: ${ano} | KM: ${km} | Preço: ${price}. Venda ou Compre seu carro rápido e seguro. ${url}`
}

export const getCommercialText = (
  vehicle: any,
  isSimulacao = false,
  simDetails?: { entrada: string; parcelas: string },
) => {
  if (!vehicle) return 'Olá! Gostaria de mais informações.'
  const name = `${vehicle.marca} ${vehicle.modelo} ${vehicle.versao || ''}`.trim()

  if (isSimulacao && simDetails) {
    return `Olá! Tenho interesse em simular o financiamento do ${name} (${vehicle.ano_fabricacao}).\n\n💰 Valor: ${formatCurrency(vehicle.preco_venda || 0)}\n💵 Entrada: R$ ${simDetails.entrada || '0'}\n📅 Parcelas: ${simDetails.parcelas}x`
  }

  return `🚗 *Oportunidade Imperdível!*\n\nOlá! Tenho interesse no veículo:\n*${name}*\n📅 Ano: ${vehicle.ano_fabricacao}/${vehicle.ano_modelo}\n🛣️ KM: ${vehicle.quilometragem ? vehicle.quilometragem.toLocaleString('pt-BR') : 'Excelente km'}\n💰 Valor: ${formatCurrency(vehicle.preco_venda || 0)}`
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
}) => {
  try {
    const leadData: any = {
      nome: 'Lead Interessado',
      tipo: 'interesse',
      origem: source,
      status: 'novo',
      cta_type: ctaType,
    }

    if (vehicle) {
      leadData.veiculo_id = vehicle.id
      leadData.veiculo_interesse = `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano_fabricacao}/${vehicle.ano_modelo}`
      if (isSimulacao) {
        leadData.veiculo_interesse += ' - Simulação Financiamento'
      }
    }

    await createLead(leadData)
  } catch (e) {
    console.error('Erro ao criar lead:', e)
  }

  trackWhatsAppClick('Luiz', ctaType)
  trackCTAClick(ctaType, source)

  const message = getCommercialText(vehicle, isSimulacao, simDetails)

  window.open(getWhatsAppLink(message), '_blank', 'noopener,noreferrer')
}
