import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

export function InternalNotes({ leadId }: { leadId: string }) {
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchNotes()
    const sub = supabase
      .channel(`notes-${leadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'internal_notes', filter: `lead_id=eq.${leadId}` },
        fetchNotes,
      )
      .subscribe()
    return () => {
      supabase.removeChannel(sub)
    }
  }, [leadId])

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('internal_notes')
      .select('*, usuarios(nome)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    if (data) setNotes(data)
  }

  const handleAdd = async () => {
    if (!newNote.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('internal_notes').insert({
      lead_id: leadId,
      author_id: user.id,
      content: newNote,
    })

    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else setNewNote('')
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <ScrollArea className="flex-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
        {notes.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">
            Nenhuma nota interna registrada.
          </p>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 mb-3 text-sm animate-fade-in-up"
          >
            <div className="flex justify-between text-[10px] text-slate-500 mb-2 border-b pb-1">
              <span className="font-bold text-blue-600">{n.usuarios?.nome || 'Equipe'}</span>
              <span>{new Date(n.created_at).toLocaleString('pt-BR')}</span>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap">{n.content}</p>
          </div>
        ))}
      </ScrollArea>
      <div className="flex flex-col gap-2 mt-auto">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Digite uma nota invisível para o cliente..."
          className="text-sm resize-none h-20 bg-slate-50"
        />
        <Button onClick={handleAdd} size="sm" className="w-full">
          Adicionar Nota Interna
        </Button>
      </div>
    </div>
  )
}
