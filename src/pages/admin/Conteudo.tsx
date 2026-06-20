import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FileText, Plus, Search, PenTool, LayoutTemplate, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PageVisualEditor } from '@/components/admin/conteudo-editor/PageVisualEditor'
import { ArticleSEOEditor } from '@/components/admin/conteudo-editor/ArticleSEOEditor'
import { useToast } from '@/hooks/use-toast'

export default function Conteudo() {
  const [activeTab, setActiveTab] = useState<'paginas' | 'artigos'>('paginas')
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!editingId) fetchItems()
  }, [activeTab, editingId])

  const fetchItems = async () => {
    const table = activeTab === 'paginas' ? 'pages' : 'articles'
    const { data } = await supabase
      .from(table)
      .select('id, titulo, status_publicacao, slug, criado_em')
      .order('criado_em', { ascending: false })
    setItems(data || [])
  }

  const [showTypeSelect, setShowTypeSelect] = useState(false)

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente excluir este item?')) return
    const table = activeTab === 'paginas' ? 'pages' : 'articles'
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error) {
      toast({ title: 'Item excluído com sucesso.' })
      fetchItems()
    }
  }

  const filteredItems = items.filter((i) => {
    const matchSearch =
      i.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      i.slug?.toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === 'todos' || i.status_publicacao === statusFilter

    return matchSearch && matchStatus
  })

  if (editingId) {
    if (activeTab === 'artigos') {
      return <ArticleSEOEditor id={editingId} onBack={() => setEditingId(null)} />
    }

    return <PageVisualEditor id={editingId} isArticle={false} onBack={() => setEditingId(null)} />
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 relative">
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Conteúdo</h1>
            <p className="text-slate-500 text-sm mt-1">
              Crie e edite as páginas e artigos do seu site usando nosso construtor visual.
            </p>
          </div>
          <div className="relative">
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
              onClick={() => setShowTypeSelect(!showTypeSelect)}
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Conteúdo
            </Button>
            {showTypeSelect && (
              <div className="absolute top-12 right-0 bg-white border shadow-xl rounded-xl p-2 w-48 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setActiveTab('paginas')
                    setEditingId('new')
                    setShowTypeSelect(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors text-slate-700"
                >
                  Nova Página
                </button>
                <button
                  onClick={() => {
                    setActiveTab('artigos')
                    setEditingId('new')
                    setShowTypeSelect(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors text-slate-700 flex items-center justify-between group"
                >
                  Novo Artigo (Blog)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
            <Tabs
              value={activeTab}
              onValueChange={(v: any) => setActiveTab(v)}
              className="w-full sm:w-[400px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paginas">
                  <LayoutTemplate className="w-4 h-4 mr-2" /> Páginas
                </TabsTrigger>
                <TabsTrigger value="artigos">
                  <PenTool className="w-4 h-4 mr-2" /> Blog & Artigos
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                className="flex h-10 w-full sm:w-40 items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="todos">Todos os Status</option>
                <option value="Publicado">Publicados</option>
                <option value="Em Revisão">Em Revisão</option>
                <option value="Rascunho">Rascunhos</option>
              </select>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <FileText className="w-12 h-12 opacity-20" />
                <p>Nenhum item encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setEditingId(item.id)}
                    className="bg-white border rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group relative"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-2 leading-tight">
                        {item.titulo || 'Sem Título'}
                      </h3>
                      <span
                        className={cn(
                          'text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider shrink-0',
                          item.status_publicacao === 'Publicado'
                            ? 'bg-green-100 text-green-700'
                            : item.status_publicacao === 'Em Revisão'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {item.status_publicacao || 'Rascunho'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">/{item.slug || 'slug'}</p>
                    <div className="mt-auto pt-4 border-t flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">
                        Editado {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(item.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
