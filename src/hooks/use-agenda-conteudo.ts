import { useState, useEffect, useCallback } from 'react'
import {
  fetchAgenda,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  generateArticleFromAgenda,
  type AgendaItem,
} from '@/services/agenda-conteudo'
import { useToast } from '@/hooks/use-toast'

export function useAgendaConteudo() {
  const [items, setItems] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAgenda()
      setItems(data)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (item: Partial<AgendaItem>) => {
      try {
        await createAgendaItem(item)
        toast({ title: 'Item criado!', description: 'Novo tópico adicionado à agenda.' })
        await load()
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      }
    },
    [load, toast],
  )

  const update = useCallback(
    async (id: string, updates: Partial<AgendaItem>) => {
      try {
        await updateAgendaItem(id, updates)
        await load()
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      }
    },
    [load, toast],
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteAgendaItem(id)
        toast({ title: 'Item removido' })
        await load()
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      }
    },
    [load, toast],
  )

  const generate = useCallback(
    async (id: string) => {
      try {
        toast({ title: 'Gerando artigo...', description: 'O agente IA está trabalhando.' })
        const result = await generateArticleFromAgenda(id)
        if (result?.success) {
          toast({
            title: 'Artigo gerado!',
            description: 'Aguardando sua revisão via WhatsApp.',
          })
        } else {
          toast({
            title: 'Erro na geração',
            description: result?.erro || 'Falha desconhecida',
            variant: 'destructive',
          })
        }
        await load()
        return result
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' })
        return null
      }
    },
    [load, toast],
  )

  return { items, loading, create, update, remove, generate, reload: load }
}
