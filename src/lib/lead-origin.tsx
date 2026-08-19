import { MessageCircle, Instagram, Facebook, Globe, Target, Car, Store } from 'lucide-react'

export function getOriginIcon(origem?: string) {
  const o = origem?.toLowerCase() || ''
  if (o.includes('whatsapp') || o.includes('wpp'))
    return <MessageCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
  if (o.includes('instagram') || o.includes('ig'))
    return <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
  if (o.includes('facebook') || o.includes('fb'))
    return <Facebook className="w-3.5 h-3.5 text-blue-600 shrink-0" />
  if (o.includes('icarros')) return <Car className="w-3.5 h-3.5 text-orange-500 shrink-0" />
  if (o.includes('mercado livre') || o.includes('mercadolivre') || o.includes('ml'))
    return <Store className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
  if (o.includes('webmotors')) return <Target className="w-3.5 h-3.5 text-red-600 shrink-0" />
  if (o.includes('google')) return <Target className="w-3.5 h-3.5 text-blue-500 shrink-0" />
  return <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
}
