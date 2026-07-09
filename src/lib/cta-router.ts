import { createLead } from '@/services/leads'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackCTAClick, trackWhatsAppClick } from '@/lib/tracking'

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export const getVehicleUrl = (vehicle: any) => {
  if (!vehicle) return 'https://www.carroeciamotors.com.br/estoque'
  return vehicle.slug
    ? `https://www.carroeciamotors.com.br/estoque/${vehicle.slug}`
    : `https://www.carroeciamotors.com.br/estoque/${vehicle.id}`
}

export const getShareText = (vehicle: any) => {
  if (!vehicle) return ''
  const price = formatCurrency(vehicle.preco_venda || 0)
  const km = vehicle.quilometragem
    ? `${vehicle.quilometragem.toLocaleString('pt-BR')} km`
    : 'Excelente km'
  const ano = `${vehicle.ano_fabricacao}/${vehicle.ano_modelo}`
  const name = `${vehicle.marca} ${vehicle.modelo} ${vehicle.versao || ''}`.trim()
  const url = getVehicleUrl(vehicle)

  return `*${name}* | Ano: ${ano} | KM: ${km} | Preço: ${price}. Venda ou Compre seu carro rápido e seguro. ${url}`
}

export const getCommercialText = (
  vehicle: any,
  isSimulacao = false,
  simDetails?: { entrada: string; parcelas: string },
) => {
  if (!vehicle) return 'Olá! Gostaria de mais informações.'
  const name = `${vehicle.marca} ${vehicle.modelo} ${vehicle.versao || ''}`.trim()
  const url = getVehicleUrl(vehicle)

  if (isSimulacao && simDetails) {
    return `Olá! Tenho interesse em simular o financiamento do ${name} (${vehicle.ano_fabricacao}).\n\n💰 Valor: ${formatCurrency(vehicle.preco_venda || 0)}\n💵 Entrada: R$ ${simDetails.entrada || '0'}\n📅 Parcelas: ${simDetails.parcelas}x\n\n${url}`
  }

  return `🚗 *Oportunidade Imperdível!*\n\nOlá! Tenho interesse no veículo:\n*${name}*\n📅 Ano: ${vehicle.ano_fabricacao}/${vehicle.ano_modelo}\n🛣️ KM: ${vehicle.quilometragem ? vehicle.quilometragem.toLocaleString('pt-BR') : 'Excelente km'}\n💰 Valor: ${formatCurrency(vehicle.preco_venda || 0)}\n\n${url}`
}

export const handleShareCTA = async (vehicle: any, source: string) => {
  if (!vehicle) return false

  const shareText = getShareText(vehicle)
  const shareUrl = getVehicleUrl(vehicle)

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
