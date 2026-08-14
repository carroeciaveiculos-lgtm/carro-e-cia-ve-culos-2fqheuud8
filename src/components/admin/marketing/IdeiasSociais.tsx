import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Vote, MessageCircleQuestion, Lightbulb, Users, Star, Plus } from 'lucide-react'

type Ideia = {
  tipo: 'enquete' | 'pergunta' | 'curiosidade' | 'bastidores' | 'prova_social'
  titulo: string
  texto_sugerido: string
}

const TIPO_INFO: Record<Ideia['tipo'], { label: string; icon: typeof Vote; color: string }> = {
  enquete: { label: 'Enquete', icon: Vote, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  pergunta: {
    label: 'Pergunta aberta',
    icon: MessageCircleQuestion,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  curiosidade: {
    label: 'Curiosidade',
    icon: Lightbulb,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  bastidores: { label: 'Bastidores', icon: Users, color: 'bg-teal-100 text-teal-700 border-teal-200' },
  prova_social: {
    label: 'Prova social',
    icon: Star,
    color: 'bg-rose-100 text-rose-700 border-rose-200',
  },
}

export function IdeiasSociais() {
  const { toast } = useToast()
  const [ideias, setIdeias] = useState<Ideia[]>([])
  const [loading, setLoading] = useState(false)
  const [usando, setUsando] = useState<number | null>(null)

  const gerarIdeias = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-ideias-social', { body: {} })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Falha ao gerar ideias')
      setIdeias(data.ideias || [])
    } catch (e: any) {
      toast({ title: 'Erro ao gerar ideias', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const usarIdeia = async (ideia: Ideia, index: number) => {
    setUsando(index)
    try {
      const { error } = await supabase.from('social_posts').insert({
        texto: ideia.texto_sugerido,
        redes: ['instagram', 'facebook'],
        status: 'Rascunho',
        content_type: ideia.tipo,
      })
      if (error) throw error
      toast({
        title: 'Rascunho criado!',
        description: 'Vá na aba Publicações pra revisar, adicionar imagem e agendar.',
      })
    } catch (e: any) {
      toast({ title: 'Erro ao criar rascunho', description: e.message, variant: 'destructive' })
    } finally {
      setUsando(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 max-w-xl">
          Sugestões de post pra manter a página ativa entre um carro e outro — enquetes,
          perguntas e curiosidades pra gerar comentários e curtidas.
        </p>
        <Button onClick={gerarIdeias} disabled={loading}>
          <Sparkles className="w-4 h-4 mr-2" />
          {loading ? 'Gerando...' : ideias.length > 0 ? 'Gerar outras ideias' : 'Gerar ideias'}
        </Button>
      </div>

      {ideias.length === 0 && !loading && (
        <div className="text-center text-slate-400 py-16 border-2 border-dashed rounded-lg bg-white">
          Clique em "Gerar ideias" pra receber sugestões de post pra hoje.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {ideias.map((ideia, i) => {
          const info = TIPO_INFO[ideia.tipo]
          const Icon = info.icon
          return (
            <div key={i} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={info.color}>
                  <Icon className="w-3 h-3 mr-1" /> {info.label}
                </Badge>
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800">{ideia.titulo}</p>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                  {ideia.texto_sugerido}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="self-start"
                disabled={usando === i}
                onClick={() => usarIdeia(ideia, i)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {usando === i ? 'Criando...' : 'Usar essa ideia'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
