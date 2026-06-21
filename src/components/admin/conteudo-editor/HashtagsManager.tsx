import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Trash2, Hash } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function HashtagsManager() {
  const [hashtags, setHashtags] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [newTag, setNewTag] = useState('')
  const [newCat, setNewCat] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchHashtags()
  }, [])

  const fetchHashtags = async () => {
    const { data } = await supabase
      .from('hashtags')
      .select('*')
      .order('created_at', { ascending: false })
    setHashtags(data || [])
  }

  const handleAdd = async () => {
    if (!newTag) return
    const tag = newTag.startsWith('#') ? newTag : `#${newTag}`
    const { error } = await supabase.from('hashtags').insert([{ tag, categoria: newCat }])
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Adicionada' })
      setNewTag('')
      setNewCat('')
      fetchHashtags()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir?')) return
    await supabase.from('hashtags').delete().eq('id', id)
    fetchHashtags()
  }

  const filtered = hashtags.filter(
    (h) =>
      h.tag?.toLowerCase().includes(search.toLowerCase()) ||
      h.categoria?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-xl border">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Nova Hashtag</label>
          <div className="relative">
            <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Ex: seminovos"
              className="pl-9"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Categoria</label>
          <Input
            placeholder="Ex: Instagram"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
        </div>
        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
        <div className="w-px h-10 bg-slate-200 mx-2 hidden sm:block"></div>
        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Hashtag</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                  Nenhuma hashtag encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-semibold text-blue-600">{h.tag}</TableCell>
                  <TableCell>{h.categoria || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(h.id)}>
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
