import { MessageCircle } from 'lucide-react'
import { getWhatsAppLink } from '@/lib/whatsapp'

export const WhatsAppButton = () => {
  const defaultMessage = 'Olá! Vim pelo site e gostaria de mais informações.'

  return (
    <a
      href={getWhatsAppLink(defaultMessage)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center group"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="w-8 h-8" />
      <span className="absolute right-full mr-4 bg-white text-black text-sm px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Fale Conosco
      </span>
    </a>
  )
}
