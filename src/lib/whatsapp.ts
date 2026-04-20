export const getWhatsAppLink = (text: string, customPhone?: string) => {
  const defaultPhone = import.meta.env.VITE_WHATSAPP_PHONE || '5534999484285'
  const phone = customPhone || defaultPhone
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
