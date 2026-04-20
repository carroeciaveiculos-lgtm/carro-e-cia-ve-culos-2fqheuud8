import { MessageCircle } from 'lucide-react'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackConversion } from '@/lib/tracking'

export const WhatsAppButton = () => {
  const defaultMessage = 'Olá Luiz! Quero saber mais sobre a consignação.'

  return (
    <a
      href={getWhatsAppLink(defaultMessage)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackConversion('whatsapp')}
      className="fixed bottom-6 right-6 z-[9999] bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center group"
      aria-label="Falar com Luiz pelo WhatsApp"
      data-event="clique_whatsapp"
    >
      <MessageCircle className="w-8 h-8" aria-hidden="true" />
      <span className="absolute right-full mr-4 bg-white text-black text-sm px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        💬 Falar com Luiz
      </span>
    </a>
  )
}
