import { useState, useEffect } from 'react'
import { Star, Quote } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Depoimento = Database['public']['Tables']['site_depoimentos']['Row']

const FALLBACK: Depoimento = {
  texto: 'Excelente loja, pessoal muito educado e atenciosos.',
  nome_cliente: 'Rodrigo Carvalho Gomide',
  tipo: 'Local Guide',
  estrelas: 5,
  id: 'fallback-1',
  foto_url: null,
  publicado: true,
  verificado: true,
  created_at: null,
}

export function TestimonialBanner() {
  const [depoimento, setDepoimento] = useState<Depoimento | null>(null)

  useEffect(() => {
    supabase
      .from('site_depoimentos')
      .select('*')
      .eq('publicado', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDepoimento(data[Math.floor(Math.random() * data.length)])
        } else {
          setDepoimento(FALLBACK)
        }
      })
  }, [])

  if (!depoimento) return null

  return (
    <div className="col-span-full bg-card border rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
      <Quote className="w-8 h-8 text-primary/30 shrink-0" />
      <div className="flex-1 text-center sm:text-left">
        <div className="flex gap-0.5 text-accent justify-center sm:justify-start mb-1">
          {Array.from({ length: depoimento.estrelas || 5 }).map((_, s) => (
            <Star key={s} className="w-4 h-4 fill-current" />
          ))}
        </div>
        <p className="text-sm italic text-muted-foreground">"{depoimento.texto}"</p>
        <p className="text-xs font-bold mt-1">{depoimento.nome_cliente}</p>
      </div>
    </div>
  )
}
