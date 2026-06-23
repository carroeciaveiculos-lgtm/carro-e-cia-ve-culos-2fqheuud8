import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useAiAssistant() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const generate = async (prompt: string, context: string, lead_id?: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { prompt, context, lead_id },
      })
      if (error) throw error
      return data?.result || null
    } catch (e: any) {
      toast({ title: 'Erro de IA', description: e.message, variant: 'destructive' })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { generate, isLoading }
}
