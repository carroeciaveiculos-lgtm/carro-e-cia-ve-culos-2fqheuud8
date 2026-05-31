import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useGerarConteudo() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const gerarConteudo = async (tema: string, palavraChave: string, tom: string) => {
    setIsGenerating(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data, error } = await supabase.functions.invoke('gerar-conteudo', {
        body: { tema, palavraChave, tom },
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido')

      return data.data
    } catch (err: any) {
      toast({ title: 'Erro ao gerar conteúdo', description: err.message, variant: 'destructive' })
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const gerarImagem = async (prompt: string) => {
    setIsGenerating(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data, error } = await supabase.functions.invoke('gerar-imagem', {
        body: { prompt },
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido')

      return data.url
    } catch (err: any) {
      toast({ title: 'Erro ao gerar imagem', description: err.message, variant: 'destructive' })
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  return { gerarConteudo, gerarImagem, isGenerating }
}
