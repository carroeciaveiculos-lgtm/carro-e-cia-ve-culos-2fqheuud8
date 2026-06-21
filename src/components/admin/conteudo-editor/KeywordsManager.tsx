import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Trash2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function KeywordsManager() {
  const [keywords, setKeywords] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [newKw, setNewKw] = useState('')
  const [newCat, setNewCat] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchKeywords()
  }, [])

  const fetchKeywords = async () => {
    const { data } = await supabase
      .from('keywords')
      .select('*')
      .order('criado_em', { ascending: false })
    setKeywords(data || [])
  }

  const handleAdd = async () => {
    if (!newKw) return
    const { error } = await supabase
      .from('keywords')
      .insert([{ palavra_chave: newKw, categoria: newCat }])
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Adicionado' })
      setNewKw('')
      setNewCat('')
      fetchKeywords()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir?')) return
    await supabase.from('keywords').delete().eq('id', id)
    fetchKeywords()
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim())
      const toInsert = lines
        .slice(1)
        .map((l) => {
          const [palavra_chave, categoria, volume_busca, dificuldade] = l.split(',')
          return {
            palavra_chave: palavra_chave?.trim(),
            categoria: categoria?.trim(),
            volume_busca: parseInt(volume_busca) || 0,
            dificuldade: dificuldade?.trim(),
          }
        })
        .filter((k) => k.palavra_chave)

      if (toInsert.length > 0) {
        const { error } = await supabase.from('keywords').insert(toInsert)
        if (error) toast({ title: 'Erro CSV', description: error.message, variant: 'destructive' })
        else {
          toast({ title: 'CSV Importado' })
          fetchKeywords()
        }
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const filtered = keywords.filter(
    (k) =>
      k.palavra_chave?.toLowerCase().includes(search.toLowerCase()) ||
      k.categoria?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-xl border">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Nova Palavra-chave
          </label>
          <Input
            placeholder="Ex: financiamento auto"
            value={newKw}
            onChange={(e) => setNewKw(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Categoria</label>
          <Input
            placeholder="Ex: Base"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
        </div>
        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
        <div className="w-px h-10 bg-slate-200 mx-2 hidden sm:block"></div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Buscar..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> CSV
          </Button>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleCsvUpload}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Palavra</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Dificuldade</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  Nenhuma keyword encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium text-slate-800">{k.palavra_chave}</TableCell>
                  <TableCell>{k.categoria || '-'}</TableCell>
                  <TableCell>{k.volume_busca || 0}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${k.dificuldade === 'Alta' ? 'bg-red-100 text-red-700' : k.dificuldade === 'Média' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {k.dificuldade || 'Baixa'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(k.id)}>
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
