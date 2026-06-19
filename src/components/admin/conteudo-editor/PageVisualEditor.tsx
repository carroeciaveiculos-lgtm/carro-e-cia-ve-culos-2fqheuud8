import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  Monitor,
  Smartphone,
  Tablet,
  Save,
  Send,
  Layout,
  Settings,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ContentBlock, PageData } from '@/types/conteudo'
import { BlockPreview } from './BlockPreview'
import { BlockEditForm } from './BlockEditForm'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function PageVisualEditor({
  id,
  isArticle,
  onBack,
}: {
  id: string
  isArticle: boolean
  onBack: () => void
}) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [pageData, setPageData] = useState<Partial<PageData>>({
    titulo: '',
    slug: '',
    status_publicacao: 'Rascunho',
    meta_title: '',
    meta_description: '',
  })
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const { toast } = useToast()

  useEffect(() => {
    if (id && id !== 'new') {
      supabase
        .from(isArticle ? 'articles' : 'pages')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (data) {
            setPageData({
              id: data.id,
              titulo: data.titulo,
              slug: data.slug,
              status_publicacao: data.status_publicacao,
              meta_title: data.meta_title,
              meta_description: data.meta_description,
            })
            try {
              const b = JSON.parse(data.conteudo || '[]')
              setBlocks(
                Array.isArray(b)
                  ? b
                  : [{ id: crypto.randomUUID(), type: 'text', data: { html: data.conteudo } }],
              )
            } catch {
              setBlocks([{ id: crypto.randomUUID(), type: 'text', data: { html: data.conteudo } }])
            }
          }
        })
    }
  }, [id, isArticle])

  const handleSave = async (status: string) => {
    if (!pageData.titulo || !pageData.slug) {
      toast({
        title: 'Atenção',
        description: 'Título e URL Slug são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const payload = {
      titulo: pageData.titulo,
      slug: pageData.slug,
      meta_title: pageData.meta_title,
      meta_description: pageData.meta_description,
      status_publicacao: status,
      conteudo: JSON.stringify(blocks),
    }

    const table = isArticle ? 'articles' : 'pages'
    let error = null

    if (id === 'new') {
      const res = await supabase.from(table).insert(payload).select().single()
      error = res.error
      if (!error && res.data) setPageData((prev) => ({ ...prev, id: res.data.id }))
    } else {
      const res = await supabase.from(table).update(payload).eq('id', id)
      error = res.error
    }

    if (error) {
      if (error.code === '23505')
        toast({
          title: 'Erro',
          description: 'URL Slug já existe. Escolha outro.',
          variant: 'destructive',
        })
      else toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Sucesso',
        description: status === 'Rascunho' ? 'Rascunho salvo' : 'Página publicada!',
      })
      setPageData((prev) => ({ ...prev, status_publicacao: status }))
    }
  }

  const addBlock = (type: any) => {
    const newBlock: ContentBlock = { id: crypto.randomUUID(), type, data: {} }
    if (type === 'hero') newBlock.data = { title: 'Novo Hero', cta_text: 'Saiba Mais' }
    if (type === 'text') newBlock.data = { html: '<p>Novo texto...</p>' }
    if (type === 'faq') newBlock.data = { items: [{ q: 'Pergunta?', a: 'Resposta' }] }

    setBlocks([...blocks, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  const moveBlock = (index: number, dir: number) => {
    if (index + dir < 0 || index + dir >= blocks.length) return
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index + dir]
    newBlocks[index + dir] = temp
    setBlocks(newBlocks)
  }

  // SEO Score calculation
  const calculateSeoScore = () => {
    let score = 0
    if ((pageData.meta_title?.length || 0) > 30) score += 20
    if ((pageData.meta_description?.length || 0) > 100) score += 20
    if ((pageData.slug?.length || 0) > 3) score += 10
    const hasH1 =
      blocks.some((b) => b.type === 'hero' && b.data.title) ||
      blocks.some((b) => b.type === 'text' && b.data.html?.includes('<h1'))
    if (hasH1) score += 25
    if (blocks.length > 1) score += 25
    return Math.min(100, score)
  }
  const seoScore = calculateSeoScore()

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">
      <header className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">
              {pageData.titulo || 'Nova Página'}
            </span>
            <span
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wider',
                pageData.status_publicacao === 'Publicado' ? 'text-green-600' : 'text-amber-600',
              )}
            >
              {pageData.status_publicacao}
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <Button
            variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="w-4 h-4 mr-2" /> Mobile
          </Button>
          <Button
            variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => setPreviewMode('tablet')}
          >
            <Tablet className="w-4 h-4 mr-2" /> Tablet
          </Button>
          <Button
            variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="w-4 h-4 mr-2" /> Desktop
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-amber-700 border-amber-200 hover:bg-amber-50 h-9"
            onClick={() => handleSave('Rascunho')}
          >
            <Save className="w-4 h-4 mr-2 hidden sm:block" /> Salvar Rascunho
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 h-9"
            onClick={() => handleSave('Publicado')}
          >
            <Send className="w-4 h-4 mr-2 hidden sm:block" /> Publicar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-80 bg-white border-r flex flex-col shrink-0 z-10">
          {selectedBlockId ? (
            <div className="p-4 flex-1 overflow-y-auto">
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 text-slate-500 -ml-2"
                onClick={() => setSelectedBlockId(null)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              {blocks.find((b) => b.id === selectedBlockId) && (
                <BlockEditForm
                  block={blocks.find((b) => b.id === selectedBlockId)}
                  onChange={(newData: any) =>
                    setBlocks(
                      blocks.map((b) => (b.id === selectedBlockId ? { ...b, data: newData } : b)),
                    )
                  }
                  onDelete={() => {
                    setBlocks(blocks.filter((b) => b.id !== selectedBlockId))
                    setSelectedBlockId(null)
                  }}
                  onMoveUp={() =>
                    moveBlock(
                      blocks.findIndex((b) => b.id === selectedBlockId),
                      -1,
                    )
                  }
                  onMoveDown={() =>
                    moveBlock(
                      blocks.findIndex((b) => b.id === selectedBlockId),
                      1,
                    )
                  }
                />
              )}
            </div>
          ) : (
            <Tabs defaultValue="blocks" className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-2 mx-4 mt-4">
                <TabsTrigger value="blocks">
                  <Layout className="w-4 h-4 mr-2" /> Blocos
                </TabsTrigger>
                <TabsTrigger value="seo">
                  <Settings className="w-4 h-4 mr-2" /> Props & SEO
                </TabsTrigger>
              </TabsList>
              <TabsContent value="blocks" className="flex-1 p-4 overflow-y-auto m-0 space-y-2">
                <p className="text-xs text-slate-500 mb-4 uppercase font-bold tracking-wider">
                  Adicionar Bloco
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => addBlock('hero')}
                >
                  <Layout className="w-5 h-5 mr-3 text-blue-500" /> Hero Section
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => addBlock('text')}
                >
                  <FileText className="w-5 h-5 mr-3 text-emerald-500" /> Bloco de Texto (Rich
                  Content)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => addBlock('gallery')}
                >
                  <Layout className="w-5 h-5 mr-3 text-purple-500" /> Galeria de Imagens
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => addBlock('faq')}
                >
                  <FileText className="w-5 h-5 mr-3 text-amber-500" /> FAQ (Acordeão)
                </Button>
              </TabsContent>
              <TabsContent value="seo" className="flex-1 p-4 overflow-y-auto m-0 space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">SEO Score</span>
                  <span
                    className={cn(
                      'font-bold',
                      seoScore > 70
                        ? 'text-green-600'
                        : seoScore > 40
                          ? 'text-amber-600'
                          : 'text-red-600',
                    )}
                  >
                    {seoScore}/100
                  </span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Título da Página *</label>
                  <Input
                    value={pageData.titulo || ''}
                    onChange={(e) => setPageData({ ...pageData, titulo: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">URL Slug *</label>
                  <Input
                    value={pageData.slug || ''}
                    onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Meta Title</label>
                  <Input
                    value={pageData.meta_title || ''}
                    onChange={(e) => setPageData({ ...pageData, meta_title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Meta Description</label>
                  <Textarea
                    value={pageData.meta_description || ''}
                    onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
                    className="mt-1 h-24"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-200/50 relative">
          <div
            className={cn(
              'bg-white min-h-[800px] shadow-2xl transition-all duration-300 mx-auto border',
              previewMode === 'mobile'
                ? 'w-[375px]'
                : previewMode === 'tablet'
                  ? 'w-[768px]'
                  : 'w-full max-w-[1200px]',
            )}
          >
            {blocks.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
                <Layout className="w-12 h-12 opacity-20" /> Adicione blocos no menu lateral para
                começar a montar sua página.
              </div>
            )}
            {blocks.map((b) => (
              <div
                key={b.id}
                className={cn(
                  'relative group cursor-pointer ring-2 transition-all',
                  selectedBlockId === b.id
                    ? 'ring-blue-500 z-10'
                    : 'ring-transparent hover:ring-slate-300',
                )}
                onClick={() => setSelectedBlockId(b.id)}
              >
                {selectedBlockId === b.id && (
                  <div className="absolute top-0 left-0 bg-blue-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-br z-20">
                    Editando {b.type}
                  </div>
                )}
                <div
                  className={cn(
                    'transition-opacity',
                    selectedBlockId && selectedBlockId !== b.id ? 'opacity-50' : 'opacity-100',
                  )}
                >
                  <BlockPreview block={b} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
