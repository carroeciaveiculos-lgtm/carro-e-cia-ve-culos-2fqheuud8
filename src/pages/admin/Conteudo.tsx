import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  FileText,
  PenTool,
  Search,
  Plus,
  ChevronLeft,
  LayoutTemplate,
  MoreVertical,
  MessageSquare,
  X,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface PageItem {
  id: string
  titulo: string
  status_publicacao: string
  tipo: 'page'
}
interface ArticleItem {
  id: string
  titulo: string
  status_publicacao: string
  tipo: 'article'
}

export default function Conteudo() {
  const [activeTab, setActiveTab] = useState<'paginas' | 'artigos'>('paginas')
  const [items, setItems] = useState<(PageItem | ArticleItem)[]>([])
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<'page' | 'article' | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!editingId) fetchItems()
  }, [activeTab, editingId])

  const fetchItems = async () => {
    if (activeTab === 'paginas') {
      const { data } = await supabase.from('pages').select('id, titulo, status_publicacao')
      setItems((data || []).map((d) => ({ ...d, tipo: 'page' })))
    } else {
      const { data } = await supabase.from('articles').select('id, titulo, status_publicacao')
      setItems((data || []).map((d) => ({ ...d, tipo: 'article' })))
    }
  }

  const filteredItems = items.filter((i) => i.titulo?.toLowerCase().includes(search.toLowerCase()))

  const handleCreateNew = (type: 'page' | 'article') => {
    setEditingType(type)
    setEditingId('new')
  }

  if (editingType === 'page')
    return (
      <PageEditor
        id={editingId}
        onBack={() => {
          setEditingId(null)
          setEditingType(null)
        }}
      />
    )
  if (editingType === 'article')
    return (
      <ArticleEditor
        id={editingId}
        onBack={() => {
          setEditingId(null)
          setEditingType(null)
        }}
      />
    )

  return (
    <div className="flex h-full bg-white relative">
      <div className="w-full md:w-1/4 md:min-w-[300px] border-r flex flex-col h-full bg-slate-50">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-bold mb-4">Gerenciar Conteúdo</h2>
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <TabsList className="w-full">
              <TabsTrigger value="paginas" className="flex-1">
                Páginas
              </TabsTrigger>
              <TabsTrigger value="artigos" className="flex-1">
                Artigos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="p-4 border-b bg-white">
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Buscar..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600"
            onClick={() => handleCreateNew(activeTab === 'paginas' ? 'page' : 'article')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova {activeTab === 'paginas' ? 'Página' : 'Artigo'}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3 mb-2 bg-white rounded border hover:border-blue-400 cursor-pointer flex flex-col gap-2 shadow-sm transition-all"
              onClick={() => {
                setEditingId(item.id)
                setEditingType(item.tipo)
              }}
            >
              <div className="flex items-center gap-2">
                {item.tipo === 'page' ? (
                  <FileText className="w-4 h-4 text-blue-500" />
                ) : (
                  <PenTool className="w-4 h-4 text-purple-500" />
                )}
                <span className="font-medium text-sm truncate flex-1">
                  {item.titulo || 'Sem Título'}
                </span>
              </div>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full w-max font-medium',
                  item.status_publicacao === 'Publicado'
                    ? 'bg-green-100 text-green-700'
                    : item.status_publicacao === 'Agendado'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700',
                )}
              >
                {item.status_publicacao || 'Rascunho'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:flex flex-1 items-center justify-center bg-slate-100 flex-col gap-4 text-slate-400">
        <LayoutTemplate className="w-16 h-16 opacity-20" />
        <p>Selecione um item para editar ou crie um novo.</p>
      </div>
    </div>
  )
}

function PageEditor({ id, onBack }: { id: string | null; onBack: () => void }) {
  const [data, setData] = useState<any>({ titulo: '', status_publicacao: 'Rascunho' })
  const [activeTab, setActiveTab] = useState('geral')
  const { toast } = useToast()

  useEffect(() => {
    if (id && id !== 'new') {
      supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single()
        .then((res) => {
          if (res.data) setData(res.data)
        })
    }
  }, [id])

  const handleSave = async (status = 'Rascunho') => {
    const payload = { ...data, status_publicacao: status }
    if (id === 'new') {
      const res = await supabase.from('pages').insert(payload).select().single()
      if (res.data) {
        toast({ title: 'Salvo!' })
        onBack()
      } else {
        toast({ title: 'Erro ao salvar', variant: 'destructive' })
      }
    } else {
      const res = await supabase.from('pages').update(payload).eq('id', id)
      if (!res.error) toast({ title: 'Atualizado!' })
      else toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-full relative">
      <div className="w-full md:w-[30%] md:min-w-[300px] border-r bg-white flex flex-col h-[50vh] md:h-full">
        <div className="p-3 border-b flex items-center gap-2 bg-slate-50">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-bold truncate">Editar Página</span>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 grid grid-cols-3">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="geral" className="flex flex-col gap-4 mt-0">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Nome da Página *
                </label>
                <Input
                  value={data.titulo || ''}
                  onChange={(e) => setData({ ...data, titulo: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Slug URL</label>
                <Input
                  value={data.slug || ''}
                  onChange={(e) => setData({ ...data, slug: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={data.status_publicacao}
                  onChange={(e) => setData({ ...data, status_publicacao: e.target.value })}
                >
                  <option value="Rascunho">Rascunho</option>
                  <option value="Publicado">Publicado</option>
                  <option value="Agendado">Agendado</option>
                </select>
              </div>
            </TabsContent>
            <TabsContent value="seo" className="flex flex-col gap-4 mt-0">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Meta Title</label>
                <Input
                  value={data.meta_title || ''}
                  onChange={(e) => setData({ ...data, meta_title: e.target.value })}
                  maxLength={60}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    (data.meta_title?.length || 0) > 60
                      ? 'text-red-500'
                      : (data.meta_title?.length || 0) >= 50
                        ? 'text-green-500'
                        : 'text-amber-500',
                  )}
                >
                  {data.meta_title?.length || 0}/60
                </span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Meta Description
                </label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24"
                  value={data.meta_description || ''}
                  onChange={(e) => setData({ ...data, meta_description: e.target.value })}
                  maxLength={160}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    (data.meta_description?.length || 0) > 160
                      ? 'text-red-500'
                      : (data.meta_description?.length || 0) >= 155
                        ? 'text-green-500'
                        : 'text-amber-500',
                  )}
                >
                  {data.meta_description?.length || 0}/160
                </span>
              </div>
            </TabsContent>
            <TabsContent value="historico" className="mt-0 text-sm text-slate-500">
              <p className="mb-2 text-xs">
                O versionamento automático armazena as últimas 50 alterações via triggers de banco
                de dados.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Ver Versões Anteriores
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="w-full md:w-[70%] flex flex-col bg-[#1e1e1e] relative h-[50vh] md:h-full">
        <div className="h-12 bg-[#2d2d2d] border-b border-[#404040] flex items-center px-4 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white h-8 px-2">
            <b className="font-serif">B</b>
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white h-8 px-2">
            <i className="font-serif">I</i>
          </Button>
          <div className="w-px h-4 bg-[#404040] mx-1 shrink-0"></div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white h-8 text-xs font-bold px-2"
          >
            H2
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white h-8 text-xs font-bold px-2"
          >
            H3
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white h-8 text-xs font-bold px-2"
          >
            Link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white h-8 text-xs font-bold px-2"
          >
            Img
          </Button>
        </div>
        <textarea
          className="flex-1 bg-transparent text-slate-200 p-6 font-mono text-sm resize-none focus:outline-none pb-24"
          value={data.conteudo || ''}
          onChange={(e) => setData({ ...data, conteudo: e.target.value })}
          placeholder="<h1>Escreva o código HTML ou Markdown aqui...</h1>"
        />

        <div className="absolute bottom-0 left-0 right-0 h-[70px] bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.1)] flex items-center justify-between px-4 md:px-6 z-10">
          <div className="flex gap-2">
            <Button
              className="bg-[#FFC107] text-black hover:bg-[#e0a800]"
              onClick={() => handleSave('Rascunho')}
            >
              Rascunho
            </Button>
            <Button
              className="bg-[#4CAF50] text-white hover:bg-[#43a047]"
              onClick={() => handleSave('Publicado')}
            >
              Publicar
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ChatbotIA contextData={data} type="page" />
    </div>
  )
}

function ArticleEditor({ id, onBack }: { id: string | null; onBack: () => void }) {
  const [data, setData] = useState<any>({ titulo: '', status_publicacao: 'Rascunho', seo_score: 0 })
  const [activeTab, setActiveTab] = useState('geral')
  const { toast } = useToast()

  useEffect(() => {
    if (id && id !== 'new') {
      supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()
        .then((res) => {
          if (res.data) setData(res.data)
        })
    }
  }, [id])

  const handleSave = async (status = 'Rascunho') => {
    const payload = { ...data, status_publicacao: status }
    if (id === 'new') {
      const res = await supabase.from('articles').insert(payload).select().single()
      if (res.data) {
        toast({ title: 'Salvo!' })
        onBack()
      } else {
        toast({ title: 'Erro ao salvar', variant: 'destructive' })
      }
    } else {
      const res = await supabase.from('articles').update(payload).eq('id', id)
      if (!res.error) toast({ title: 'Atualizado!' })
      else toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const seoScore = data.seo_score || 0

  return (
    <div className="flex flex-col md:flex-row w-full h-full relative">
      <div className="w-full md:w-[30%] md:min-w-[300px] border-r bg-white flex flex-col h-[50vh] md:h-full">
        <div className="p-3 border-b flex items-center gap-2 bg-slate-50">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-bold truncate">Editar Artigo</span>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 grid grid-cols-4">
            <TabsTrigger value="geral" className="text-xs px-1">
              Geral
            </TabsTrigger>
            <TabsTrigger value="seo" className="text-xs px-1">
              SEO
            </TabsTrigger>
            <TabsTrigger value="avancado" className="text-xs px-1">
              Avanç
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-xs px-1">
              Hist
            </TabsTrigger>
          </TabsList>

          {activeTab === 'seo' && (
            <div className="px-4 pt-4 pb-2 border-b">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-500">SEO Score</span>
                <span
                  className={cn(
                    'text-xs font-bold',
                    seoScore >= 70
                      ? 'text-green-500'
                      : seoScore >= 40
                        ? 'text-amber-500'
                        : 'text-red-500',
                  )}
                >
                  {seoScore}/100
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full',
                    seoScore >= 70
                      ? 'bg-green-500'
                      : seoScore >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                  )}
                  style={{ width: `${Math.max(seoScore, 5)}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="geral" className="flex flex-col gap-4 mt-0">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Título do Artigo *
                </label>
                <Input
                  value={data.titulo || ''}
                  onChange={(e) => setData({ ...data, titulo: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Categoria *
                </label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={data.categoria || ''}
                  onChange={(e) => setData({ ...data, categoria: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Consignação">Consignação</option>
                  <option value="Compra">Compra</option>
                  <option value="Segurança">Segurança</option>
                  <option value="Documentação">Documentação</option>
                  <option value="Avaliação">Avaliação</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={data.status_publicacao}
                  onChange={(e) => setData({ ...data, status_publicacao: e.target.value })}
                >
                  <option value="Rascunho">Rascunho</option>
                  <option value="Publicado">Publicado</option>
                  <option value="Agendado">Agendado</option>
                </select>
              </div>
            </TabsContent>
            <TabsContent value="seo" className="flex flex-col gap-4 mt-0">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">H1 Artigo</label>
                <Input
                  value={data.h1_artigo || ''}
                  onChange={(e) => setData({ ...data, h1_artigo: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Meta Description
                </label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24"
                  value={data.meta_description || ''}
                  onChange={(e) => setData({ ...data, meta_description: e.target.value })}
                  maxLength={160}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    (data.meta_description?.length || 0) > 160
                      ? 'text-red-500'
                      : (data.meta_description?.length || 0) >= 155
                        ? 'text-green-500'
                        : 'text-amber-500',
                  )}
                >
                  {data.meta_description?.length || 0}/160
                </span>
              </div>
            </TabsContent>
            <TabsContent value="avancado" className="mt-0 text-sm text-slate-500">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Tempo de Leitura
                </label>
                <Input
                  value={`${Math.max(1, Math.ceil((data.conteudo?.length || 0) / 1000))} min`}
                  disabled
                />
              </div>
            </TabsContent>
            <TabsContent value="historico" className="mt-0 text-sm text-slate-500">
              <p className="mb-2 text-xs">
                O versionamento automático armazena as últimas 50 alterações via triggers de banco
                de dados.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Ver Versões Anteriores
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="w-full md:w-[70%] flex flex-col bg-[#1e1e1e] relative h-[50vh] md:h-full">
        <div className="h-12 bg-[#2d2d2d] border-b border-[#404040] flex items-center px-4 gap-2">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white h-8 px-2">
            <b className="font-serif">B</b>
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white h-8 px-2">
            <i className="font-serif">I</i>
          </Button>
          <div className="w-px h-4 bg-[#404040] mx-1 shrink-0"></div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white h-8 text-xs font-bold px-2"
          >
            H2
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white h-8 text-xs font-bold px-2"
          >
            H3
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-blue-600 text-white border-0 hover:bg-blue-700 h-8 ml-auto"
          >
            Inserir CTA
          </Button>
        </div>
        <textarea
          className="flex-1 bg-transparent text-slate-200 p-6 font-mono text-sm resize-none focus:outline-none pb-24"
          value={data.conteudo || ''}
          onChange={(e) => setData({ ...data, conteudo: e.target.value })}
          placeholder="Escreva seu artigo aqui..."
        />
        <div className="absolute bottom-0 left-0 right-0 h-[70px] bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.1)] flex items-center justify-between px-4 md:px-6 z-10">
          <div className="flex gap-2">
            <Button
              className="bg-[#FFC107] text-black hover:bg-[#e0a800]"
              onClick={() => handleSave('Rascunho')}
            >
              Rascunho
            </Button>
            <Button
              className="bg-[#4CAF50] text-white hover:bg-[#43a047]"
              onClick={() => handleSave('Publicado')}
            >
              Publicar
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-red-500">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ChatbotIA contextData={data} type="article" />
    </div>
  )
}

function ChatbotIA({ contextData, type }: { contextData: any; type: string }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'ia'; text: string }[]>([
    {
      role: 'ia',
      text: 'Olá! Sou seu Assistente de Conteúdo SEO. Digite "Sugerir H1", "Meta description" ou "Analisar palavras-chave".',
    },
  ])
  const endRef = useRef<HTMLDivElement>(null)

  const handleSend = () => {
    if (!input.trim()) return
    const newMsg = input
    setMessages((p) => [...p, { role: 'user', text: newMsg }])
    setInput('')

    setTimeout(() => {
      let reply =
        'Entendido! Baseado no seu conteúdo, essa é minha sugestão de melhoria focada em SEO e conversão.'

      const lowerMsg = newMsg.toLowerCase()
      if (lowerMsg.includes('h1')) {
        reply = `**Sugestões H1 (50-60 caracteres):**\n1. Consigne Seu Carro com Segurança — 20 Anos de Confiança\n2. Venda Seu Veículo em 48 Horas — Consignação Segura\n3. ${contextData.categoria || 'Carros Seminovos'} com Segurança — Procedência Garantida`
      } else if (lowerMsg.includes('meta')) {
        reply =
          'Sua meta description otimizada (158 chars): Venda seu carro rápido e seguro. Consignação profissional, contrato protegido, avaliação gratuita. Carro e Cia — 20 anos de confiança em Uberaba. Agende já!'
      } else if (lowerMsg.includes('readability') || lowerMsg.includes('legibilidade')) {
        reply =
          'Score Flesch-Kincaid: 75 (Fácil). Dica: Use parágrafos mais curtos e listas com bullets para melhorar o escaneamento do leitor.'
      } else if (lowerMsg.includes('palavra') || lowerMsg.includes('densidade')) {
        reply =
          "Análise de Palavras-chave:\n- 'consignação': 2.5% 🟢\n- 'vender carro': 0.8% 🟡 (Aumente ocorrências)\n- 'Uberaba': 1.2% 🟢"
      } else if (lowerMsg.includes('link')) {
        reply =
          "Sugestão de Links Internos:\n1. Link para '/blog/como-funciona-consignacao' na seção de 'Vantagens'.\n2. Link para '/estoque' na conclusão."
      } else if (lowerMsg.includes('cta')) {
        reply =
          "Sugestões de CTA Contextual:\n1. 'Não espere mais. Consigne seu carro agora e venda em 7 dias garantido!'\n2. 'Agende sua avaliação grátis hoje mesmo!'"
      }

      setMessages((p) => [...p, { role: 'ia', text: reply }])
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 800)
  }

  if (!open) {
    return (
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-0 md:bottom-6 right-0 md:right-6 w-full md:w-[320px] h-[60vh] md:h-[500px] bg-white border border-slate-200 rounded-t-2xl md:rounded-lg shadow-[0_2px_15px_rgba(0,0,0,0.2)] flex flex-col z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-blue-500 p-4 rounded-t-2xl md:rounded-t-lg flex items-center justify-between text-white shadow-sm z-10">
        <h3 className="font-semibold text-sm">Assistente de Conteúdo IA</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white hover:bg-blue-600"
          onClick={() => setOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 bg-[#fafafa] overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'p-3 rounded-xl max-w-[85%] text-sm shadow-sm',
              m.role === 'user'
                ? 'bg-blue-500 text-white self-end rounded-tr-sm'
                : 'bg-[#e3f2fd] text-slate-800 self-start rounded-tl-sm whitespace-pre-line leading-relaxed',
            )}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="h-[60px] border-t p-2 flex gap-2 bg-white rounded-b-lg">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Pergunte sobre SEO, H1..."
          className="h-full text-sm bg-slate-50"
        />
        <Button
          onClick={handleSend}
          className="h-full w-12 p-0 bg-blue-500 hover:bg-blue-600 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
