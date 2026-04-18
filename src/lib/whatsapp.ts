export const getWhatsAppLink = (text: string) => {
  const phone = import.meta.env.VITE_WHATSAPP_PHONE || '5534999484285'
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
