import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Tag,
  History,
  Image as ImageIcon,
  Upload,
} from 'lucide-react'
import { RevisionHistoryModal } from './RevisionHistoryModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MediaSelectorModal } from './MediaSelectorModal'
import { FaqSchemaTool } from './FaqSchemaTool'
import { InternalLinkSuggestions } from './InternalLinkSuggestions'
import { AiHeadingDraft } from './AiHeadingDraft'
import { Monitor, Smartphone } from 'lucide-react'

interface ArticleSEOEditorProps {
  id: string
  onBack: () => void
}

interface ArticleData {
  id?: string
  titulo: string
  slug: string
  meta_title: string
  meta_description: string
  h1_artigo: string
  conteudo: string
  palavras_chave_principais: string[]
  palavras_chave_secundarias: string[]
  status_publicacao: string
  imagem_destaque_url: string
  og_title: string
  og_description: string
  og_image_url: string
  notas_internas: string
  autor_id: string
  faq_schema: string
}

const DEFAULT_ARTICLE: ArticleData = {
  titulo: '',
  slug: '',
  meta_title: '',
  meta_description: '',
  h1_artigo: '',
  conteudo: '',
  palavras_chave_principais: [],
  palavras_chave_secundarias: [],
  status_publicacao: 'Rascunho',
  imagem_destaque_url: '',
  og_title: '',
  og_description: '',
  og_image_url: '',
  notas_internas: '',
  autor_id: '',
  faq_schema: '',
}

export function ArticleSEOEditor({ id, onBack }: ArticleSEOEditorProps) {
  const [data, setData] = useState<ArticleData>(DEFAULT_ARTICLE)
  const [isLoading, setIsLoading] = useState(id !== 'new')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [brainstormTitle, setBrainstormTitle] = useState('')
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'social'>('editor')
  const [seoScore, setSeoScore] = useState(0)
  const [seoChecklist, setSeoChecklist] = useState<{ id: string; text: string; passed: boolean }[]>(
    [],
  )
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [dbKeywords, setDbKeywords] = useState<string[]>([])
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false)
  const [authors, setAuthors] = useState<{ id: string; nome: string }[]>([])
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const { toast } = useToast()

  useEffect(() => {
    supabase
      .from('keywords')
      .select('palavra_chave')
      .then(({ data }) => {
        if (data) setDbKeywords(data.map((k: any) => k.palavra_chave))
      })
    supabase
      .from('usuarios')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        if (data) setAuthors(data)
      })
  }, [])

  useEffect(() => {
    if (id !== 'new') {
      fetchArticle()
    }
  }, [id])

  useEffect(() => {
    calculateSEO(data)
  }, [data])

  const fetchArticle = async () => {
    setIsLoading(true)
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      toast({
        title: 'Erro ao carregar artigo',
        description: error.message,
        variant: 'destructive',
      })
      onBack()
    } else if (article) {
      setData({
        id: article.id,
        titulo: article.titulo || '',
        slug: article.slug || '',
        meta_title: article.meta_title || '',
        meta_description: article.meta_description || '',
        h1_artigo: article.h1_artigo || '',
        conteudo: article.conteudo || '',
        palavras_chave_principais: (article.palavras_chave_principais as string[]) || [],
        palavras_chave_secundarias: (article.palavras_chave_secundarias as string[]) || [],
        status_publicacao: article.status_publicacao || 'Rascunho',
        imagem_destaque_url: article.imagem_destaque_url || '',
        og_title: article.og_title || '',
        og_description: article.og_description || '',
        og_image_url: article.og_image_url || '',
        notas_internas: article.notas_internas || '',
        autor_id: article.autor_id || '',
        faq_schema: article.faq_schema || '',
      })
    }
    setIsLoading(false)
  }

  const generateAIContent = async () => {
    if (!brainstormTitle) return
    setIsGenerating(true)

    // Simulate generation steps
    setGenerationStep(1) // "Pesquisando ideias..."
    const stepInterval = setInterval(() => {
      setGenerationStep((s) => (s < 3 ? s + 1 : s))
    }, 2500)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data: result, error } = await supabase.functions.invoke('gerar-conteudo', {
        body: {
          is_seo_copilot: true,
          title: brainstormTitle,
        },
      })

      if (error) throw error
      if (!result?.success) throw new Error(result?.error || 'Erro ao gerar conteúdo')

      const aiData = result.data

      setData((prev) => ({
        ...prev,
        titulo: brainstormTitle,
        slug: aiData.slug || '',
        meta_title: aiData.meta_title || '',
        meta_description: aiData.meta_description || '',
        h1_artigo: aiData.h1_artigo || '',
        conteudo: aiData.conteudo_html || '',
        palavras_chave_principais: Array.isArray(aiData.palavras_chave_principais)
          ? aiData.palavras_chave_principais
          : [],
        palavras_chave_secundarias: Array.isArray(aiData.palavras_chave_secundarias)
          ? aiData.palavras_chave_secundarias
          : [],
      }))

      toast({ title: 'Artigo gerado com sucesso!' })
    } catch (error: any) {
      toast({
        title: 'Falha ao gerar',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      clearInterval(stepInterval)
      setIsGenerating(false)
      setGenerationStep(0)
    }
  }

  const calculateSEO = (currentData: ArticleData) => {
    let score = 0
    const checks = []

    const wordCount = currentData.conteudo
      .replace(/<[^>]*>?/gm, '')
      .split(/\s+/)
      .filter((w) => w.length > 0).length
    const hasEnoughWords = wordCount >= 300
    score += hasEnoughWords ? 20 : 0
    checks.push({
      id: 'words',
      text: `Mínimo de 300 palavras (${wordCount}/300)`,
      passed: hasEnoughWords,
    })

    const mtLen = currentData.meta_title.length
    const goodMt = mtLen >= 40 && mtLen <= 60
    score += goodMt ? 20 : 0
    checks.push({ id: 'mt', text: `Meta Title entre 40-60 chars (${mtLen})`, passed: goodMt })

    const mdLen = currentData.meta_description.length
    const goodMd = mdLen >= 120 && mdLen <= 160
    score += goodMd ? 20 : 0
    checks.push({
      id: 'md',
      text: `Meta Description entre 120-160 chars (${mdLen})`,
      passed: goodMd,
    })

    const firstKw = currentData.palavras_chave_principais[0]?.toLowerCase() || ''
    const contentLower = currentData.conteudo.toLowerCase()

    // Check if kw is in first paragraph roughly
    const firstP = contentLower.substring(0, 300)
    const kwInFirstP = firstKw ? firstP.includes(firstKw.toLowerCase()) : false
    score += kwInFirstP ? 15 : 0
    checks.push({
      id: 'kw_p1',
      text: `Palavra-chave principal no início do texto`,
      passed: kwInFirstP,
    })

    // Check if kw in H2/H3
    const hasKwInHeaders = firstKw
      ? (contentLower.includes(`<h2`) && contentLower.includes(firstKw.toLowerCase())) ||
        (contentLower.includes(`<h3`) && contentLower.includes(firstKw.toLowerCase()))
      : false
    score += hasKwInHeaders ? 15 : 0
    checks.push({
      id: 'kw_h2',
      text: `Palavra-chave em subtítulos (H2/H3)`,
      passed: !!hasKwInHeaders,
    })

    // Check image alt text (if any image exists, does it have alt?)
    const imgMatch = contentLower.match(/<img[^>]+alt=["']([^"']+)["']/i)
    let altPassed = false
    if (contentLower.includes('<img')) {
      if (imgMatch && imgMatch[1].trim().length > 0) {
        altPassed = true
      }
    } else {
      altPassed = true // Pass se não houver imagens
    }
    score += altPassed ? 10 : 0
    checks.push({
      id: 'img_alt',
      text: `Imagens com texto alternativo (Alt)`,
      passed: altPassed,
    })

    setSeoScore(score)
    setSeoChecklist(checks)
  }

  const handleSave = async (status: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const payload = {
        titulo: data.titulo,
        slug: data.slug,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        h1_artigo: data.h1_artigo,
        conteudo: data.conteudo,
        palavras_chave_principais: data.palavras_chave_principais,
        palavras_chave_secundarias: data.palavras_chave_secundarias,
        status_publicacao: status,
        seo_score: seoScore,
        imagem_destaque_url: data.imagem_destaque_url,
        og_title: data.og_title,
        og_description: data.og_description,
        og_image_url: data.og_image_url,
        notas_internas: data.notas_internas,
        faq_schema: data.faq_schema || null,
        ...(id === 'new'
          ? {
              autor_id: data.autor_id || user?.id,
              ia_generated: true,
              requires_review: status === 'Rascunho',
            }
          : {
              autor_id: data.autor_id || user?.id,
              requires_review: status === 'Rascunho',
            }),
      }

      if (id === 'new') {
        const { error } = await supabase.from('articles').insert([payload])
        if (error) throw error
        toast({ title: 'Artigo criado com sucesso!' })
        onBack()
      } else {
        const { error } = await supabase.from('articles').update(payload).eq('id', id)
        if (error) throw error

        // Track version
        await supabase.from('article_versions').insert([
          {
            article_id: id,
            acao: 'update_seo_copilot',
            ...payload,
          },
        ])

        toast({ title: 'Artigo salvo com sucesso!' })
        onBack()
      }
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleAddKeyword = (
    type: 'principais' | 'secundarias',
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      e.preventDefault()
      const val = e.currentTarget.value.trim()
      const key = type === 'principais' ? 'palavras_chave_principais' : 'palavras_chave_secundarias'

      if (!data[key].includes(val)) {
        setData({ ...data, [key]: [...data[key], val] })
      }
      e.currentTarget.value = ''
    }
  }

  const removeKeyword = (type: 'principais' | 'secundarias', kw: string) => {
    const key = type === 'principais' ? 'palavras_chave_principais' : 'palavras_chave_secundarias'
    setData({ ...data, [key]: data[key].filter((k) => k !== kw) })
  }

  const optimizeWithAI = async () => {
    setIsOptimizing(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data: result, error } = await supabase.functions.invoke('gerar-conteudo', {
        body: {
          is_seo_optimizer: true,
          current_data: { ...data },
        },
      })

      if (error) throw error
      if (!result?.success) throw new Error(result?.error || 'Erro ao otimizar')

      const aiData = result.data

      setData((prev) => ({
        ...prev,
        titulo: aiData.titulo || prev.titulo,
        slug: aiData.slug || prev.slug,
        meta_title: aiData.meta_title || prev.meta_title,
        meta_description: aiData.meta_description || prev.meta_description,
        h1_artigo: aiData.h1_artigo || prev.h1_artigo,
        conteudo: aiData.conteudo_html || prev.conteudo,
        palavras_chave_principais: Array.isArray(aiData.palavras_chave_principais)
          ? aiData.palavras_chave_principais
          : prev.palavras_chave_principais,
        palavras_chave_secundarias: Array.isArray(aiData.palavras_chave_secundarias)
          ? aiData.palavras_chave_secundarias
          : prev.palavras_chave_secundarias,
      }))

      toast({ title: 'Conteúdo otimizado com IA!' })
    } catch (err: any) {
      toast({ title: 'Falha ao otimizar', description: err.message, variant: 'destructive' })
    } finally {
      setIsOptimizing(false)
    }
  }

  const generateAIImage = async () => {
    if (!imagePrompt) return
    setIsGeneratingImage(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data: result, error } = await supabase.functions.invoke('gerar-imagem', {
        body: { prompt: imagePrompt },
      })
      if (error) throw error
      if (!result?.success) throw new Error(result?.error || 'Erro ao gerar')

      // Converter imagem gerada para WebP no client
      setIsUploading(true)
      const res = await fetch(result.url)
      const blob = await res.blob()

      const imageBitmap = await createImageBitmap(blob)
      const canvas = document.createElement('canvas')
      canvas.width = imageBitmap.width
      canvas.height = imageBitmap.height
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.drawImage(imageBitmap, 0, 0)

      const webpBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.8),
      )
      if (!webpBlob) throw new Error('Falha ao converter IA para WebP')

      const fileName = `${Date.now()}-ia-destaque.webp`
      const { error: uploadError } = await supabase.storage
        .from('imagens')
        .upload(`blog/${fileName}`, webpBlob, { contentType: 'image/webp' })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('imagens')
        .getPublicUrl(`blog/${fileName}`)
      setData({ ...data, imagem_destaque_url: publicUrlData.publicUrl })
      toast({ title: 'Imagem IA gerada e convertida (WebP)!' })
      setImagePrompt('')
    } catch (err: any) {
      toast({ title: 'Erro na IA', description: err.message, variant: 'destructive' })
    } finally {
      setIsGeneratingImage(false)
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Converter para WebP no client
      const imageBitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = imageBitmap.width
      canvas.height = imageBitmap.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(imageBitmap, 0, 0)
      }

      const webpBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8)
      })

      if (!webpBlob) throw new Error('Falha ao converter para WebP')

      const fileName = `${Date.now()}-destaque.webp`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('imagens')
        .upload(`blog/${fileName}`, webpBlob, { contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('imagens')
        .getPublicUrl(`blog/${fileName}`)
      setData({ ...data, imagem_destaque_url: publicUrlData.publicUrl })
      toast({ title: 'Imagem otimizada (WebP) e enviada com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao enviar imagem', description: err.message, variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRestoreVersion = (versionData: any) => {
    if (!versionData || !versionData.html) return
    setData((prev) => ({
      ...prev,
      conteudo: versionData.html,
      ...(versionData.fullData
        ? {
            titulo: versionData.fullData.titulo || prev.titulo,
            slug: versionData.fullData.slug || prev.slug,
            meta_title: versionData.fullData.meta_title || prev.meta_title,
            meta_description: versionData.fullData.meta_description || prev.meta_description,
            h1_artigo: versionData.fullData.h1_artigo || prev.h1_artigo,
            palavras_chave_principais: Array.isArray(versionData.fullData.palavras_chave_principais)
              ? versionData.fullData.palavras_chave_principais
              : prev.palavras_chave_principais,
            palavras_chave_secundarias: Array.isArray(
              versionData.fullData.palavras_chave_secundarias,
            )
              ? versionData.fullData.palavras_chave_secundarias
              : prev.palavras_chave_secundarias,
            imagem_destaque_url:
              versionData.fullData.imagem_destaque_url || prev.imagem_destaque_url,
          }
        : {}),
    }))
    setIsHistoryOpen(false)
    toast({ title: 'Versão restaurada no editor! Salve para aplicar as mudanças.' })
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Carregando...</div>
  }

  // Brainstorming Dashboard State
  if (id === 'new' && !data.conteudo && !isGenerating) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-slate-800">SEO Copilot AI</h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Sobre o que vamos escrever hoje?</h2>
            <p className="text-slate-500">
              Digite um tema ou título e deixe nossa IA pesquisar, estruturar e redigir um artigo
              otimizado para os motores de busca.
            </p>

            <div className="relative max-w-xl mx-auto mt-6">
              <Input
                value={brainstormTitle}
                onChange={(e) => setBrainstormTitle(e.target.value)}
                placeholder="Ex: Vale a pena financiar um carro seminovo em 2026?"
                className="pl-4 pr-32 py-6 text-lg rounded-xl shadow-inner border-slate-200 focus-visible:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && generateAIContent()}
              />
              <Button
                onClick={generateAIContent}
                disabled={!brainstormTitle}
                className="absolute right-2 top-2 bottom-2 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Gerar Artigo
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col h-full bg-slate-50 items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-8 text-center space-y-6">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">O Copilot está trabalhando...</h2>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 text-slate-600">
              {generationStep >= 1 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
              )}
              <span className={generationStep >= 1 ? 'text-slate-900 font-medium' : ''}>
                Pesquisando ideias disruptivas...
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              {generationStep >= 2 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
              )}
              <span className={generationStep >= 2 ? 'text-slate-900 font-medium' : ''}>
                Gerando estrutura SEO...
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              {generationStep >= 3 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
              )}
              <span className={generationStep >= 3 ? 'text-slate-900 font-medium' : ''}>
                Redigindo o conteúdo final...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
      <MediaSelectorModal
        open={mediaSelectorOpen}
        onOpenChange={setMediaSelectorOpen}
        onSelect={(url: string) => setData((prev) => ({ ...prev, imagem_destaque_url: url }))}
      />
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Editor de Artigo (SEO Copilot)</h1>
            <p className="text-sm text-slate-500">
              {id === 'new' ? 'Revisão de rascunho gerado por IA' : 'Editando artigo existente'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {id !== 'new' && (
            <Button
              variant="ghost"
              className="text-slate-600"
              onClick={() => setIsHistoryOpen(true)}
            >
              <History className="w-4 h-4 mr-2" />
              Histórico
            </Button>
          )}
          <Button
            variant="secondary"
            className="bg-amber-100 text-amber-800 hover:bg-amber-200"
            onClick={optimizeWithAI}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Otimizar com IA
          </Button>
          <Button variant="outline" onClick={() => handleSave('Rascunho')}>
            Salvar Rascunho
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleSave('Publicado')}>
            <Save className="w-4 h-4 mr-2" />
            Publicar Artigo
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Informações Básicas
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Imagem de Destaque (Convertida para WebP)</Label>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  {data.imagem_destaque_url && (
                    <img
                      src={data.imagem_destaque_url}
                      alt="Destaque"
                      className="w-32 h-20 object-cover rounded-lg border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2 h-20">
                        <Label
                          htmlFor="img-upload"
                          className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col items-center">
                            <Upload className="w-5 h-5 text-slate-400" />
                            <span className="text-xs text-slate-500 mt-1">
                              {isUploading ? 'Otimizando...' : 'Upload'}
                            </span>
                          </div>
                          <input
                            id="img-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isUploading || isGeneratingImage}
                          />
                        </Label>
                        <Button
                          variant="outline"
                          className="h-full flex-1 flex-col gap-1 border-2 border-dashed"
                          onClick={() => setMediaSelectorOpen(true)}
                          disabled={isUploading || isGeneratingImage}
                        >
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                          <span className="text-xs text-slate-500">Biblioteca</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end gap-2 border p-3 rounded-lg bg-slate-50">
                      <Label className="text-xs flex items-center gap-1 text-slate-500">
                        <Sparkles className="w-3 h-3 text-amber-500" /> Ou Gerar Imagem com IA
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: Um carro elétrico na cidade"
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          disabled={isGeneratingImage || isUploading}
                          className="h-8 text-sm bg-white"
                        />
                        <Button
                          size="sm"
                          onClick={generateAIImage}
                          disabled={!imagePrompt || isGeneratingImage || isUploading}
                        >
                          {isGeneratingImage ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'Gerar'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título Interno</Label>
                  <Input
                    value={data.titulo}
                    onChange={(e) => setData({ ...data, titulo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={data.slug}
                    onChange={(e) => setData({ ...data, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>H1 do Artigo</Label>
                <Input
                  value={data.h1_artigo}
                  onChange={(e) => setData({ ...data, h1_artigo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Autor do Artigo</Label>
                <select
                  className="flex h-10 w-full items-center rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background"
                  value={data.autor_id}
                  onChange={(e) => setData({ ...data, autor_id: e.target.value })}
                >
                  <option value="">Selecione um autor...</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Estrutura de Headings (IA)</Label>
                <AiHeadingDraft
                  articleTitle={data.titulo || data.h1_artigo}
                  onInsert={(html) =>
                    setData((prev) => ({ ...prev, conteudo: prev.conteudo + '\n' + html }))
                  }
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="font-semibold text-slate-800">Metadados SEO</h2>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Meta Title</Label>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      data.meta_title.length > 60
                        ? 'text-red-500'
                        : data.meta_title.length > 0
                          ? 'text-green-600'
                          : 'text-slate-400',
                    )}
                  >
                    {data.meta_title.length} / 60
                  </span>
                </div>
                <Input
                  value={data.meta_title}
                  onChange={(e) => setData({ ...data, meta_title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Meta Description</Label>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      data.meta_description.length > 160
                        ? 'text-red-500'
                        : data.meta_description.length > 0
                          ? 'text-green-600'
                          : 'text-slate-400',
                    )}
                  >
                    {data.meta_description.length} / 160
                  </span>
                </div>
                <Textarea
                  value={data.meta_description}
                  onChange={(e) => setData({ ...data, meta_description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label>Palavras-chave Principais (Enter p/ add)</Label>
                  <div className="relative">
                    <Input
                      onKeyDown={(e) => handleAddKeyword('principais', e)}
                      placeholder="Adicionar..."
                      list="db-keywords"
                    />
                    <datalist id="db-keywords">
                      {dbKeywords.map((k) => (
                        <option key={k} value={k} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.palavras_chave_principais.map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 flex items-center gap-1"
                      >
                        {kw}{' '}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeKeyword('principais', kw)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Palavras-chave Secundárias</Label>
                  <div className="relative">
                    <Input
                      onKeyDown={(e) => handleAddKeyword('secundarias', e)}
                      placeholder="Adicionar..."
                      list="db-keywords"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.palavras_chave_secundarias.map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="bg-slate-100 flex items-center gap-1"
                      >
                        {kw}{' '}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeKeyword('secundarias', kw)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="flex border-b bg-slate-50">
                <button
                  className={cn(
                    'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'editor'
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-slate-600 hover:bg-slate-100',
                  )}
                  onClick={() => setActiveTab('editor')}
                >
                  Editor HTML
                </button>
                <button
                  className={cn(
                    'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'preview'
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-slate-600 hover:bg-slate-100',
                  )}
                  onClick={() => setActiveTab('preview')}
                >
                  Preview Visual
                </button>
                <button
                  className={cn(
                    'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'social'
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-slate-600 hover:bg-slate-100',
                  )}
                  onClick={() => setActiveTab('social')}
                >
                  Social & Equipe
                </button>
              </div>
              <div className="flex-1 p-0 relative">
                {' '}
                {activeTab === 'editor' ? (
                  <>
                    <Button
                      size="sm"
                      className="absolute right-4 bottom-4 z-10 bg-purple-600 hover:bg-purple-700 shadow-md"
                      onClick={async () => {
                        const prompt = window.prompt('O que a IA deve escrever no final do texto?')
                        if (!prompt) return
                        setIsOptimizing(true)
                        try {
                          const {
                            data: { session },
                          } = await supabase.auth.getSession()
                          if (!session) throw new Error('Não autenticado')
                          const { data: res, error } = await supabase.functions.invoke(
                            'gerar-conteudo',
                            {
                              body: {
                                tema: prompt,
                                palavraChave: data.palavras_chave_principais[0] || 'geral',
                                tom: 'profissional',
                              },
                            },
                          )
                          if (error) throw error
                          if (res?.data?.conteudo_html || res?.data?.conteudo) {
                            const newContent = res.data.conteudo_html || res.data.conteudo
                            setData((prev) => ({
                              ...prev,
                              conteudo: prev.conteudo + '\n' + newContent,
                            }))
                            toast({ title: 'Texto gerado com sucesso!' })
                          }
                        } catch (err: any) {
                          toast({
                            title: 'Erro ao gerar',
                            description: err.message,
                            variant: 'destructive',
                          })
                        } finally {
                          setIsOptimizing(false)
                        }
                      }}
                      disabled={isOptimizing}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar com IA
                    </Button>
                    <Textarea
                      className="w-full h-full border-0 focus-visible:ring-0 rounded-none resize-none p-6 font-mono text-sm pb-16"
                      value={data.conteudo}
                      onChange={(e) => setData({ ...data, conteudo: e.target.value })}
                      placeholder="<h2>Seu título aqui</h2><p>Comece a escrever...</p>"
                    />
                  </>
                ) : (
                  <>
                    {activeTab === 'preview' && (
                      <div className="w-full h-full flex flex-col">
                        <div className="flex justify-center gap-2 py-2 border-b bg-slate-50">
                          <Button
                            size="sm"
                            variant={previewMode === 'desktop' ? 'default' : 'outline'}
                            onClick={() => setPreviewMode('desktop')}
                          >
                            <Monitor className="w-4 h-4 mr-1" /> Desktop
                          </Button>
                          <Button
                            size="sm"
                            variant={previewMode === 'mobile' ? 'default' : 'outline'}
                            onClick={() => setPreviewMode('mobile')}
                          >
                            <Smartphone className="w-4 h-4 mr-1" /> Mobile
                          </Button>
                        </div>
                        <div
                          className={cn(
                            'flex-1 overflow-y-auto p-8 prose max-w-none mx-auto',
                            previewMode === 'mobile'
                              ? 'max-w-[375px] border-x-2 border-slate-200'
                              : 'max-w-none',
                          )}
                          dangerouslySetInnerHTML={{
                            __html:
                              data.conteudo ||
                              '<p class="text-slate-400">Nenhum conteúdo gerado ainda.</p>',
                          }}
                        />
                      </div>
                    )}
                    {activeTab === 'social' && (
                      <div className="p-8 space-y-8 h-full overflow-y-auto bg-slate-50">
                        <div>
                          <h3 className="font-bold text-slate-800 mb-4">Preview Social</h3>
                          <div className="max-w-[400px] border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            {data.og_image_url || data.imagem_destaque_url ? (
                              <img
                                src={data.og_image_url || data.imagem_destaque_url}
                                className="w-full h-[210px] object-cover"
                              />
                            ) : (
                              <div className="w-full h-[210px] bg-slate-200 flex items-center justify-center text-slate-400">
                                Sem imagem
                              </div>
                            )}
                            <div className="p-4 bg-slate-100/50">
                              <p className="text-[10px] text-slate-500 uppercase mb-2">
                                carroeciamotors.com.br
                              </p>
                              <Input
                                value={data.og_title}
                                onChange={(e) => setData({ ...data, og_title: e.target.value })}
                                placeholder="Título Opcional (se vazio usa o principal)"
                                className="font-bold text-sm h-8 mb-2"
                              />
                              <Textarea
                                value={data.og_description}
                                onChange={(e) =>
                                  setData({ ...data, og_description: e.target.value })
                                }
                                placeholder="Descrição Opcional"
                                className="text-xs h-16 resize-none"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="max-w-[400px]">
                          <h3 className="font-bold text-amber-800 mb-2">
                            Notas Internas da Equipe
                          </h3>
                          <Textarea
                            value={data.notas_internas}
                            onChange={(e) => setData({ ...data, notas_internas: e.target.value })}
                            placeholder="Revisor: Verifique as fontes antes de publicar..."
                            className="bg-amber-50 border-amber-200 h-32"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar SEO Panel */}
        <div className="w-80 border-l bg-white shrink-0 flex flex-col">
          <div className="p-6 border-b">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" /> SEO Live Score
            </h3>

            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className={cn(
                      'transition-all duration-1000',
                      seoScore >= 80
                        ? 'text-green-500'
                        : seoScore >= 50
                          ? 'text-amber-500'
                          : 'text-red-500',
                    )}
                    strokeDasharray={`${seoScore}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-slate-800">{seoScore}</span>
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                    Score
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Checklist de Otimização</h4>
              {seoChecklist.map((check) => (
                <div key={check.id} className="flex items-start gap-2 text-sm">
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span className={cn(check.passed ? 'text-slate-700' : 'text-slate-500')}>
                    {check.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-50 flex-1 space-y-6">
            <FaqSchemaTool
              content={data.conteudo}
              existingSchema={data.faq_schema}
              onSchemaChange={(schema) => setData({ ...data, faq_schema: schema })}
            />
            <InternalLinkSuggestions
              keywords={data.palavras_chave_principais}
              currentId={id}
            />
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Dicas do Copilot</h4>
            <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-xl border border-blue-100">
              Mantenha seu conteúdo sempre atualizado e utilize links internos para outras páginas
              do seu site para fortalecer a autoridade do seu domínio.
            </div>
          </div>
        </div>
      </div>

      {isHistoryOpen && (
        <RevisionHistoryModal
          id={id}
          isArticle={true}
          currentBlocks={[]}
          currentDesignVars={{}}
          currentHtml={data.conteudo}
          onClose={() => setIsHistoryOpen(false)}
          onRestore={handleRestoreVersion}
        />
      )}
    </div>
  )
}
