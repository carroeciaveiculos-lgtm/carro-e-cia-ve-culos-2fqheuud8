import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, Loader2, Sparkles, Car } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIContentReview({ open, onOpenChange }: Props) {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('veiculos')
      .select('id, marca, modelo, ano_modelo, descricao, requires_review, fotos')
      .eq('requires_review', true)
      .order('created_at', { ascending: false })
    setVehicles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  const handleApprove = async (id: string) => {
    setApproving(id)
    try {
      const payload: any = { requires_review: false }
      if (editingId === id && editText.trim()) {
        payload.descricao = editText
      }
      await supabase.from('veiculos').update(payload).eq('id', id)
      toast({ title: 'Descrição aprovada e publicada!' })
      setEditingId(null)
      setEditText('')
      load()
    } catch {
      toast({ title: 'Erro ao aprovar', variant: 'destructive' })
    } finally {
      setApproving(null)
    }
  }

  const handleEdit = (id: string, currentDesc: string) => {
    setEditingId(id)
    setEditText(currentDesc || '')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Revisão de Conteúdo IA ({vehicles.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              Nenhuma descrição pendente de revisão!
            </div>
          ) : (
            vehicles.map((v) => (
              <div key={v.id} className="border rounded-lg p-4 space-y-2 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm">
                    {v.marca} {v.modelo}
                  </span>
                  <Badge variant="secondary" className="text-[9px]">
                    {v.ano_modelo || 'N/A'}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-700 text-[9px]">IA Pendente</Badge>
                </div>
                {editingId === v.id ? (
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="bg-white text-sm"
                    rows={5}
                  />
                ) : (
                  <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                    {v.descricao || 'Sem descrição'}
                  </p>
                )}
                <div className="flex gap-2">
                  {editingId === v.id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null)
                        setEditText('')
                      }}
                    >
                      Cancelar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(v.id, v.descricao)}
                    >
                      Editar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(v.id)}
                    disabled={approving === v.id}
                  >
                    {approving === v.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    )}
                    Aprovar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
