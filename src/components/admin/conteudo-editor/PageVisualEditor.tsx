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
  Palette,
  Sparkles,
  Columns,
  Grid3X3,
  Image as ImageIcon,
  Type,
  BookTemplate,
  Eye,
  History,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ContentBlock, PageData, BlockTemplate } from '@/types/conteudo'
import { useAuth } from '@/hooks/use-auth'
import { RevisionHistoryModal } from './RevisionHistoryModal'
import { BlockPreview } from './BlockPreview'
import { BlockEditForm } from './BlockEditForm'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAiAssistant } from '@/hooks/use-ai-assistant'
import { MediaSelectorModal } from './MediaSelectorModal'

export function PageVisualEditor({
  id,
  isArticle,
  isLandingPage,
  onBack,
}: {
  id: string
  isArticle: boolean
  isLandingPage?: boolean
  onBack: () => void
}) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [pageData, setPageData] = useState<Partial<PageData>>({
    titulo: '',
    slug: '',
    status_publicacao: 'Rascunho',
    meta_title: '',
    meta_description: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
    notas_internas: '',
  })
  const [designVars, setDesignVars] = useState({
    primaryColor: '#2563eb',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.5rem',
  })
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [templates, setTemplates] = useState<BlockTemplate[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [userRole, setUserRole] = useState('operador')
  const { toast } = useToast()
  const { generate, isLoading: aiLoading } = useAiAssistant()
  const { user } = useAuth()
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false)
  const [mediaSelectorCallback, setMediaSelectorCallback] = useState<
    ((url: string) => void) | null
  >(null)

  useEffect(() => {
    const handleOpenMedia = (e: any) => {
      setMediaSelectorCallback(() => e.detail.onSelect)
      setMediaSelectorOpen(true)
    }
    window.addEventListener('open-media-selector', handleOpenMedia)
    return () => window.removeEventListener('open-media-selector', handleOpenMedia)
  }, [])

  useEffect(() => {
    if (user) {
      supabase
        .from('usuarios')
        .select('nivel')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserRole(data.nivel || 'operador')
        })
    }
  }, [user])

  useEffect(() => {
    supabase
      .from('block_templates')
      .select('*')
      .then(({ data }) => {
        if (data) setTemplates(data)
      })
  }, [])

  useEffect(() => {
    if (id && id !== 'new') {
      const table = isLandingPage ? 'landing_pages' : isArticle ? 'articles' : 'pages'
      supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (data) {
            if (isLandingPage) {
              setPageData({
                id: data.id,
                titulo: data.title,
                slug: data.slug,
                status_publicacao: data.published ? 'Publicado' : 'Rascunho',
                meta_title: '',
                meta_description: data.meta_description,
                og_title: data.og_title || '',
                og_description: data.og_description || '',
                og_image_url: data.og_image_url || '',
                notas_internas: data.notas_internas || '',
              })
              try {
                const b = typeof data.content === 'string' ? JSON.parse(data.content) : data.content
                if (b?.designVars) setDesignVars(b.designVars)
                setBlocks(Array.isArray(b?.blocks) ? b.blocks : Array.isArray(b) ? b : [])
              } catch {
                setBlocks([])
              }
            } else {
              setPageData({
                id: data.id,
                titulo: data.titulo,
                slug: data.slug,
                status_publicacao: data.status_publicacao,
                meta_title: data.meta_title,
                meta_description: data.meta_description,
                og_title: data.og_title || '',
                og_description: data.og_description || '',
                og_image_url: data.og_image_url || '',
                notas_internas: data.notas_internas || '',
              })
              try {
                const b = JSON.parse(data.conteudo || '[]')
                if (b.designVars) setDesignVars(b.designVars)
                setBlocks(Array.isArray(b.blocks) ? b.blocks : Array.isArray(b) ? b : [])
              } catch {
                setBlocks([
                  { id: crypto.randomUUID(), type: 'text', data: { html: data.conteudo } },
                ])
              }
            }
          }
        })
    }
  }, [id, isArticle, isLandingPage])

  const handleSave = async (status: string) => {
    if (!pageData.titulo || !pageData.slug) {
      toast({
        title: 'Atenção',
        description: 'Título e URL Slug são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    let payload: any = {}
    let table = isArticle ? 'articles' : 'pages'

    if (isLandingPage) {
      table = 'landing_pages'
      payload = {
        title: pageData.titulo,
        slug: pageData.slug,
        meta_description: pageData.meta_description,
        notas_internas: pageData.notas_internas,
        published: status === 'Publicado',
        content: { blocks, designVars },
      }
    } else {
      payload = {
        titulo: pageData.titulo,
        slug: pageData.slug,
        meta_title: pageData.meta_title,
        meta_description: pageData.meta_description,
        og_title: pageData.og_title,
        og_description: pageData.og_description,
        og_image_url: pageData.og_image_url,
        notas_internas: pageData.notas_internas,
        status_publicacao: status,
        conteudo: JSON.stringify({ blocks, designVars }),
      }
    }

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
      if (status === 'Em Revisão' && pageData.status_publicacao !== 'Em Revisão') {
        supabase.functions
          .invoke('content-workflow-notification', {
            body: {
              title: pageData.titulo,
              authorName: user?.user_metadata?.name || 'Autor Desconhecido',
              authorEmail: user?.email,
              link: `${window.location.origin}/admin/conteudo`,
            },
          })
          .catch((err) => console.error('Erro ao notificar revisão:', err))

        toast({
          title: 'Sucesso',
          description: 'Conteúdo enviado para revisão e notificado!',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: status === 'Rascunho' ? 'Rascunho salvo' : 'Página salva e/ou publicada!',
        })
      }
      setPageData((prev) => ({ ...prev, status_publicacao: status }))
    }
  }

  const addBlock = (type: any) => {
    const newBlock: ContentBlock = { id: crypto.randomUUID(), type, data: {}, style: {} }
    if (type === 'hero') newBlock.data = { title: 'Novo Hero', cta_text: 'Saiba Mais' }
    if (type === 'text') newBlock.data = { html: '<p>Novo texto...</p>' }
    if (type === 'flex') {
      newBlock.data = {}
      newBlock.style = { gap: '1rem', padding: '2rem', alignItems: 'center' }
      newBlock.children = []
    }
    if (type === 'grid') {
      newBlock.data = {}
      newBlock.style = { gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', padding: '2rem' }
      newBlock.children = []
    }

    setBlocks([...blocks, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  const insertTemplate = (template: BlockTemplate) => {
    const reId = (block: any): any => ({
      ...block,
      id: crypto.randomUUID(),
      children: block.children ? block.children.map(reId) : undefined,
    })

    const content = Array.isArray(template.conteudo)
      ? template.conteudo.map(reId)
      : [reId(template.conteudo)]
    setBlocks([...blocks, ...content])
    toast({ title: 'Template inserido com sucesso!' })
  }

  const handleAiGenerate = async () => {
    const prompt = window.prompt(
      "Descreva o que o Assistente Luiz deve gerar (ex: 'Página de vendas para SUVs'):",
    )
    if (!prompt) return
    const res = await generate(
      `Gere um array JSON de blocos para um editor visual baseado no seguinte pedido: ${prompt}. Formato: [{type: 'hero', data: {title: '...'}}, {type: 'text', data: {html: '...'}}]. Apenas JSON.`,
      'JSON_ONLY',
    )
    try {
      const parsed = JSON.parse(res || '[]')
      const newBlocks = parsed.map((b: any) => ({ ...b, id: crypto.randomUUID() }))
      setBlocks([...blocks, ...newBlocks])
      toast({ title: 'Conteúdo Gerado!' })
    } catch {
      toast({ title: 'Erro ao analisar JSON da IA', variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden text-sm">
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
          {id !== 'new' && !isLandingPage && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-slate-600"
              onClick={() => setShowHistory(true)}
            >
              <History className="w-4 h-4 mr-2 hidden sm:block" /> Histórico
            </Button>
          )}
          <Button
            variant="outline"
            className="text-slate-700 border-slate-200 hover:bg-slate-50 h-9"
            onClick={() => handleSave('Rascunho')}
          >
            <Save className="w-4 h-4 mr-2 hidden sm:block" /> Rascunho
          </Button>
          <Button
            variant="outline"
            className="text-amber-700 border-amber-200 hover:bg-amber-50 h-9"
            onClick={() => handleSave('Em Revisão')}
          >
            <Eye className="w-4 h-4 mr-2 hidden sm:block" /> Em Revisão
          </Button>
          {userRole === 'admin' && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 h-9"
              onClick={() => handleSave('Publicado')}
            >
              <Send className="w-4 h-4 mr-2 hidden sm:block" /> Publicar
            </Button>
          )}
        </div>
      </header>

      <MediaSelectorModal
        open={mediaSelectorOpen}
        onOpenChange={setMediaSelectorOpen}
        onSelect={(url: string) => {
          if (mediaSelectorCallback) mediaSelectorCallback(url)
          setMediaSelectorOpen(false)
        }}
      />

      {showHistory && id !== 'new' && !isLandingPage && (
        <RevisionHistoryModal
          id={id}
          isArticle={isArticle}
          currentBlocks={blocks}
          currentDesignVars={designVars}
          onClose={() => setShowHistory(false)}
          onRestore={(v) => {
            setBlocks(v.blocks || [])
            if (v.designVars) setDesignVars(v.designVars)
            setShowHistory(false)
          }}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-80 bg-white border-r flex flex-col shrink-0 z-10">
          {selectedBlockId ? (
            <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
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
                  onStyleChange={(newStyle: any) =>
                    setBlocks(
                      blocks.map((b) => (b.id === selectedBlockId ? { ...b, style: newStyle } : b)),
                    )
                  }
                  onDelete={() => {
                    setBlocks(blocks.filter((b) => b.id !== selectedBlockId))
                    setSelectedBlockId(null)
                  }}
                />
              )}
            </div>
          ) : (
            <Tabs defaultValue="blocks" className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-4 mx-4 mt-4 h-10 overflow-x-auto no-scrollbar">
                <TabsTrigger value="blocks" className="text-[10px]">
                  <Layout className="w-3 h-3 mr-1" /> Blocos
                </TabsTrigger>
                <TabsTrigger value="library" className="text-[10px]">
                  <BookTemplate className="w-3 h-3 mr-1" /> Biblio
                </TabsTrigger>
                <TabsTrigger value="design" className="text-[10px]">
                  <Palette className="w-3 h-3 mr-1" /> Design
                </TabsTrigger>
                <TabsTrigger value="seo" className="text-[10px]">
                  <Settings className="w-3 h-3 mr-1" /> Config
                </TabsTrigger>
              </TabsList>

              <TabsContent value="blocks" className="flex-1 p-4 overflow-y-auto m-0 space-y-2">
                <Button
                  className="w-full mb-4 bg-purple-600 hover:bg-purple-700 h-10"
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                >
                  <Sparkles className="w-4 h-4 mr-2" />{' '}
                  {aiLoading ? 'Gerando...' : 'Assistente Luiz (IA)'}
                </Button>
                <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-wider">
                  Containers Estruturais
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1"
                    onClick={() => addBlock('flex')}
                  >
                    <Columns className="w-4 h-4 text-blue-500" />{' '}
                    <span className="text-[10px]">Flexbox</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1"
                    onClick={() => addBlock('grid')}
                  >
                    <Grid3X3 className="w-4 h-4 text-purple-500" />{' '}
                    <span className="text-[10px]">Grid</span>
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-wider">
                  Elementos Básicos
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1"
                    onClick={() => addBlock('hero')}
                  >
                    <Layout className="w-4 h-4 text-slate-700" />{' '}
                    <span className="text-[10px]">Hero</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1"
                    onClick={() => addBlock('text')}
                  >
                    <Type className="w-4 h-4 text-slate-700" />{' '}
                    <span className="text-[10px]">Texto</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1"
                    onClick={() => addBlock('gallery')}
                  >
                    <ImageIcon className="w-4 h-4 text-slate-700" />{' '}
                    <span className="text-[10px]">Galeria</span>
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500 mb-2 mt-4 uppercase font-bold tracking-wider">
                  Blocos de Veículos
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1 border-blue-200 bg-blue-50"
                    onClick={() => addBlock('vehicle-card')}
                  >
                    <Layout className="w-4 h-4 text-blue-600" />{' '}
                    <span className="text-[10px] text-blue-800">Card Veículo</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1 border-blue-200 bg-blue-50"
                    onClick={() => addBlock('stock-slider')}
                  >
                    <Columns className="w-4 h-4 text-blue-600" />{' '}
                    <span className="text-[10px] text-blue-800">Slider Destaques</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1 border-blue-200 bg-blue-50"
                    onClick={() => addBlock('inventory-grid')}
                  >
                    <Grid3X3 className="w-4 h-4 text-blue-600" />{' '}
                    <span className="text-[10px] text-blue-800">Grid Estoque</span>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="library" className="flex-1 p-4 overflow-y-auto m-0 space-y-2">
                <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-wider">
                  Modelos Prontos
                </p>
                {templates.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">
                    Nenhum template encontrado.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="border rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all bg-slate-50 group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-xs">{t.nome}</span>
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            {t.categoria}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs bg-white group-hover:bg-blue-50 group-hover:text-blue-700"
                          onClick={() => insertTemplate(t)}
                        >
                          <Layout className="w-3 h-3 mr-2" /> Inserir Bloco
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="design" className="flex-1 p-4 overflow-y-auto m-0 space-y-4">
                <p className="text-xs text-slate-500 mb-4 uppercase font-bold tracking-wider">
                  Design System Manager
                </p>
                <div>
                  <label className="text-xs font-bold text-slate-700">Cor Primária</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={designVars.primaryColor}
                      onChange={(e) =>
                        setDesignVars({ ...designVars, primaryColor: e.target.value })
                      }
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={designVars.primaryColor}
                      onChange={(e) =>
                        setDesignVars({ ...designVars, primaryColor: e.target.value })
                      }
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Família da Fonte</label>
                  <Input
                    value={designVars.fontFamily}
                    onChange={(e) => setDesignVars({ ...designVars, fontFamily: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Arredondamento Padrão</label>
                  <Input
                    value={designVars.borderRadius}
                    onChange={(e) => setDesignVars({ ...designVars, borderRadius: e.target.value })}
                    className="mt-1"
                    placeholder="ex: 0.5rem"
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="flex-1 p-4 overflow-y-auto m-0 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Título da Página *</label>
                  <Input
                    value={pageData.titulo || ''}
                    onChange={(e) => setPageData({ ...pageData, titulo: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">URL Slug *</label>
                  <Input
                    value={pageData.slug || ''}
                    onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Meta Title</label>
                  <Input
                    value={pageData.meta_title || ''}
                    onChange={(e) => setPageData({ ...pageData, meta_title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Meta Description</label>
                  <Textarea
                    value={pageData.meta_description || ''}
                    onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
                    className="mt-1 h-16"
                  />
                </div>
                {!isLandingPage && (
                  <>
                    <div className="border-t pt-4">
                      <label className="text-xs font-bold text-slate-700">
                        Preview Social (Facebook/WhatsApp)
                      </label>
                      <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        {pageData.og_image_url ? (
                          <img
                            src={pageData.og_image_url}
                            className="w-full h-[150px] object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-[150px] bg-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-300"
                            onClick={() => setMediaSelectorOpen(true)}
                          >
                            <ImageIcon className="w-6 h-6 mb-1" /> Adicionar Imagem
                          </div>
                        )}
                        <div className="p-3 bg-slate-50">
                          <p className="text-[10px] text-slate-500 uppercase mb-1">
                            carroeciamotors.com.br
                          </p>
                          <Input
                            value={pageData.og_title || ''}
                            onChange={(e) => setPageData({ ...pageData, og_title: e.target.value })}
                            placeholder="Título Social"
                            className="h-7 text-xs font-bold mb-1 p-1"
                          />
                          <Input
                            value={pageData.og_description || ''}
                            onChange={(e) =>
                              setPageData({ ...pageData, og_description: e.target.value })
                            }
                            placeholder="Descrição Social"
                            className="h-7 text-xs p-1"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="border-t pt-4">
                  <label className="text-xs font-bold text-amber-700">
                    Notas Internas da Equipe
                  </label>
                  <Textarea
                    value={pageData.notas_internas || ''}
                    onChange={(e) => setPageData({ ...pageData, notas_internas: e.target.value })}
                    placeholder="Deixe instruções ou anotações para a equipe de revisão..."
                    className="mt-1 h-24 bg-amber-50 border-amber-200"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-200/50 relative no-scrollbar">
          <div
            style={
              {
                '--primary': designVars.primaryColor,
                '--font-base': designVars.fontFamily,
                '--radius': designVars.borderRadius,
              } as React.CSSProperties
            }
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
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedBlockId(b.id)
                }}
              >
                {selectedBlockId === b.id && (
                  <div className="absolute top-0 left-0 bg-blue-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-br z-20">
                    Editando {b.type}
                  </div>
                )}
                <BlockPreview block={b} />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
