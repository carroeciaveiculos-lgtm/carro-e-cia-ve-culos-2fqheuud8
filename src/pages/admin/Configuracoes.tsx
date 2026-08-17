import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import {
  Save,
  Share2,
  Facebook,
  Instagram,
  MessageCircle,
  BrainCircuit,
  Upload,
  FileText,
  Database,
  Send,
  Trash,
  MessageSquare,
  Download,
  Phone,
  Bot,
  MapPin,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContactsConfigPanel } from '@/components/admin/ContactsConfigPanel'
import { StoreSeoConfigPanel } from '@/components/admin/StoreSeoConfigPanel'

const CATEGORIAS_BRAIN_IA = [
  { value: 'sdr', label: 'Atendimento (Clara / SDR)' },
  { value: 'seo_blog', label: 'Conteúdo / Blog (SEO)' },
  { value: 'geral', label: 'Geral' },
]

export default function Configuracoes() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('contatos')
  const [socialConfig, setSocialConfig] = useState<any>({
    id: null,
    instagram_token: '',
    facebook_page_id: '',
    facebook_token: '',
    whatsapp_number: '',
    ai_system_prompt: '',
  })

  // Brain IA state
  const [counts, setCounts] = useState({ veiculos: 0, articles: 0, brain: 0 })
  const [knowledge, setKnowledge] = useState<any[]>([])
  const [newTextTitle, setNewTextTitle] = useState('')
  const [newTextContent, setNewTextContent] = useState('')
  const [newTextCategoria, setNewTextCategoria] = useState('sdr')
  const [testPrompt, setTestPrompt] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [prompts, setPrompts] = useState<any[]>([])

  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
    loadMemoryCounts()
    loadKnowledge()
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    const { data } = await supabase.from('ai_prompts_config').select('*').order('name')
    if (data) setPrompts(data)
  }

  const loadConfig = async () => {
    const { data: socialData } = await supabase
      .from('social_configuracoes')
      .select('*')
      .limit(1)
      .single()
    if (socialData) {
      setSocialConfig(socialData)
    }
  }

  const loadMemoryCounts = async () => {
    const { count: vCount } = await supabase
      .from('veiculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'disponivel')
    const { count: aCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status_publicacao', 'Publicado')
    const { count: bCount } = await supabase
      .from('brain_ia_knowledge')
      .select('*', { count: 'exact', head: true })
    setCounts({ veiculos: vCount || 0, articles: aCount || 0, brain: bCount || 0 })
  }

  const loadKnowledge = async () => {
    const { data } = await supabase
      .from('brain_ia_knowledge')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setKnowledge(data)
  }

  const handleSaveText = async () => {
    if (!newTextTitle || !newTextContent)
      return toast({ title: 'Preencha os campos', variant: 'destructive' })
    const { error } = await supabase.from('brain_ia_knowledge').insert({
      tipo: 'texto',
      titulo: newTextTitle,
      conteudo: newTextContent,
      categoria: newTextCategoria,
    })
    if (error)
      return toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    toast({ title: 'Texto padrão ouro salvo!' })
    setNewTextTitle('')
    setNewTextContent('')
    loadKnowledge()
    loadMemoryCounts()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('brain_docs')
        .upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: publicUrl } = supabase.storage.from('brain_docs').getPublicUrl(fileName)

      const { error: insertError } = await supabase.from('brain_ia_knowledge').insert({
        tipo: 'documento',
        titulo: file.name,
        file_name: file.name,
        file_url: publicUrl.publicUrl,
        categoria: newTextCategoria,
      })
      if (insertError) throw insertError
      toast({ title: 'Documento enviado e indexado!' })
      loadKnowledge()
      loadMemoryCounts()
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleDeleteKnowledge = async (id: string) => {
    const { error } = await supabase.from('brain_ia_knowledge').delete().eq('id', id)
    if (error)
      return toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' })
    toast({ title: 'Item removido da memória' })
    loadKnowledge()
    loadMemoryCounts()
  }

  const handleTestAI = async () => {
    if (!testPrompt) return
    setIsTesting(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { prompt: testPrompt },
      })
      if (error) throw error
      setTestResponse(data.result)
    } catch (err: any) {
      toast({ title: 'Erro na IA', description: err.message, variant: 'destructive' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveSocial = async () => {
    setLoading(true)
    try {
      if (socialConfig.id) {
        const { error } = await supabase
          .from('social_configuracoes')
          .update(socialConfig)
          .eq('id', socialConfig.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('social_configuracoes')
          .insert([socialConfig])
          .select()
          .single()
        if (error) throw error
        if (data) setSocialConfig(data)
      }
      toast({ title: 'Configurações salvas com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePromptText = (index: number, val: string) => {
    const newPrompts = [...prompts]
    newPrompts[index].prompt_text = val
    setPrompts(newPrompts)
  }

  const handleRestorePrompt = (index: number) => {
    const newPrompts = [...prompts]
    newPrompts[index].prompt_text = newPrompts[index].default_prompt
    setPrompts(newPrompts)
  }

  const handleSavePrompt = async (prompt: any) => {
    setLoading(true)
    const { error } = await supabase
      .from('ai_prompts_config')
      .update({ prompt_text: prompt.prompt_text })
      .eq('id', prompt.id)
    setLoading(false)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Prompt salvo com sucesso!' })
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Configurações do Sistema</h1>
        <p className="text-slate-500">
          Gerencie dados da loja, SEO global, scripts de rastreamento e integrações.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="contatos" className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> Contatos
          </TabsTrigger>
          <TabsTrigger value="loja-seo" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Loja & SEO
          </TabsTrigger>
          <TabsTrigger value="brain" className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> Brain IA
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Bot className="w-4 h-4" /> Prompts IA
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contatos" className="space-y-6">
          <ContactsConfigPanel />
        </TabsContent>

        <TabsContent value="loja-seo" className="space-y-6">
          <StoreSeoConfigPanel />
        </TabsContent>

        <TabsContent value="brain" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Veículos Indexados</p>
                  <p className="text-3xl font-bold text-blue-900">{counts.veiculos}</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center">
                  <Database className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Artigos Aprendidos</p>
                  <p className="text-3xl font-bold text-green-900">{counts.articles}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 text-green-700 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Textos e Docs</p>
                  <p className="text-3xl font-bold text-purple-900">{counts.brain}</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2 max-w-sm">
            <Label>Categoria (pra que serve esse conteúdo)</Label>
            <Select value={newTextCategoria} onValueChange={setNewTextCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_BRAIN_IA.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Só o que estiver em "Atendimento (Clara / SDR)" ou "Geral" entra na conversa da
              Clara com o cliente — conteúdo de blog/SEO fica de fora. Vale pro texto e pro
              upload de documento abaixo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Treinamento Textual (Gold Standard)</CardTitle>
                <CardDescription>Insira textos, diretrizes e regras de tom de voz.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título / Assunto</Label>
                  <Input
                    value={newTextTitle}
                    onChange={(e) => setNewTextTitle(e.target.value)}
                    placeholder="Ex: Regras de Consignação"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo do Treinamento</Label>
                  <Textarea
                    value={newTextContent}
                    onChange={(e) => setNewTextContent(e.target.value)}
                    placeholder="A Carro e Cia realiza consignação com taxa de X%..."
                    className="h-32"
                  />
                </div>
                <Button onClick={handleSaveText} className="w-full">
                  <Save className="w-4 h-4 mr-2" /> Salvar na Memória
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Materiais de Apoio (Docs)</CardTitle>
                <CardDescription>
                  Faça upload de manuais, PDFs ou referências em texto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                  <Input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploadingDoc}
                  />
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-700">
                      {uploadingDoc ? 'Enviando...' : 'Clique para selecionar arquivo'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">PDF, TXT ou Word</span>
                  </Label>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {knowledge.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border text-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {k.tipo === 'documento' ? (
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="font-medium truncate">{k.titulo}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 shrink-0">
                          {CATEGORIAS_BRAIN_IA.find((c) => c.value === k.categoria)?.label ||
                            k.categoria ||
                            'geral'}
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0 ml-2">
                        {k.tipo === 'documento' && k.file_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            asChild
                          >
                            <a href={k.file_url} target="_blank" rel="noreferrer" download>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeleteKnowledge(k.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-200 shadow-md">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BrainCircuit className="w-5 h-5 text-blue-600" /> AI Playground (Teste Prático)
              </CardTitle>
              <CardDescription>
                Faça perguntas à IA para ver como ela utiliza a memória ativa atual.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-4 mb-4">
                <Input
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Ex: Como você abordaria um cliente de consignação?"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleTestAI()}
                />
                <Button
                  onClick={handleTestAI}
                  disabled={isTesting || !testPrompt}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" /> {isTesting ? 'Pensando...' : 'Perguntar'}
                </Button>
              </div>
              {testResponse && (
                <div className="p-4 bg-slate-900 text-slate-100 rounded-lg text-sm whitespace-pre-wrap font-mono">
                  {testResponse}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold">Gerenciamento de Prompts da IA</h3>
            <p className="text-slate-500 text-sm">
              Personalize as instruções que guiam o comportamento da IA em cada setor da loja.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {prompts.map((prompt, index) => (
              <Card key={prompt.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-500" />
                    {prompt.name}
                  </CardTitle>
                  <CardDescription>{prompt.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    className="min-h-[150px] font-mono text-sm leading-relaxed"
                    value={prompt.prompt_text}
                    onChange={(e) => handleUpdatePromptText(index, e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm" onClick={() => handleRestorePrompt(index)}>
                      Restaurar Padrão
                    </Button>
                    <Button size="sm" onClick={() => handleSavePrompt(prompt)} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" /> Integrações de APIs & Sociais
              </CardTitle>
              <CardDescription>
                Configure os tokens para automações de redes sociais e APIs externas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" /> System Prompt da IA
                    (Legado)
                  </Label>
                  <Textarea
                    value={socialConfig.ai_system_prompt || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, ai_system_prompt: e.target.value })
                    }
                    placeholder="Ex: Você é um assistente de marketing experiente focado em venda de seminovos..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-slate-500">
                    Nota: Migre suas configurações de IA para a aba "Prompts IA".
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" /> Token Instagram
                  </Label>
                  <Input
                    type="password"
                    value={socialConfig.instagram_token || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, instagram_token: e.target.value })
                    }
                    placeholder="IGQ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" /> ID da Página Facebook
                  </Label>
                  <Input
                    value={socialConfig.facebook_page_id || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, facebook_page_id: e.target.value })
                    }
                    placeholder="123456789..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" /> Token da Página (Page Access
                    Token)
                  </Label>
                  <Input
                    type="password"
                    value={socialConfig.facebook_token || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, facebook_token: e.target.value })
                    }
                    placeholder="EAA..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" /> Número do WhatsApp (WA.ME)
                  </Label>
                  <Input
                    value={socialConfig.whatsapp_number || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, whatsapp_number: e.target.value })
                    }
                    placeholder="Ex: 5534999999999"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t mt-6">
                <Button
                  onClick={handleSaveSocial}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" /> Salvar Integrações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
