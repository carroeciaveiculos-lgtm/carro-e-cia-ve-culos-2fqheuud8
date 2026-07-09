import { MessageCircle } from 'lucide-react'
import { handleCommercialCTA } from '@/lib/cta-router'

export const WhatsAppButton = () => {
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        handleCommercialCTA({
          ctaType: 'floating_whatsapp',
          source: window.location.pathname,
        })
      }}
      className="fixed bottom-[120px] right-5 z-[999] bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center group"
      aria-label="Falar com Luiz pelo WhatsApp"
      data-event="clique_whatsapp"
    >
      <MessageCircle className="w-8 h-8" aria-hidden="true" />
      <span className="absolute right-full mr-4 bg-white text-black text-sm px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        💬 Falar com Luiz
      </span>
    </button>
  )
}
