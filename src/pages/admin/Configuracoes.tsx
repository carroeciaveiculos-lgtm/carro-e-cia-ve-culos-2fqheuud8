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
  Clock,
  Trash,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Configuracoes() {
  const [loading, setLoading] = useState(false)
  const [socialConfig, setSocialConfig] = useState<any>({
    id: null,
    instagram_token: '',
    facebook_page_id: '',
    facebook_token: '',
    whatsapp_number: '',
    ai_system_prompt: '',
  })

  const [counts, setCounts] = useState({ veiculos: 0, articles: 0, brain: 0 })
  const [knowledge, setKnowledge] = useState<any[]>([])
  const [newTextTitle, setNewTextTitle] = useState('')
  const [newTextContent, setNewTextContent] = useState('')
  const [testPrompt, setTestPrompt] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
    loadMemoryCounts()
    loadKnowledge()
  }, [])

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
    const { error } = await supabase
      .from('brain_ia_knowledge')
      .insert({ tipo: 'texto', titulo: newTextTitle, conteudo: newTextContent })
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Configurações do Sistema</h1>
        <p className="text-slate-500">
          Gerencie a Memória Ativa da IA (Brain IA) e Integrações Sociais.
        </p>
      </div>

      <Tabs defaultValue="brain" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="brain" className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> Brain IA (Memória Ativa)
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Integrações Sociais
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" /> Integrações Sociais (Automação IA)
              </CardTitle>
              <CardDescription>
                Configure os tokens para permitir postagens automáticas geradas pela IA diretamente
                no Feed e Stories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" /> System Prompt da IA (Tom
                    de Voz)
                  </Label>
                  <Textarea
                    value={socialConfig.ai_system_prompt || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, ai_system_prompt: e.target.value })
                    }
                    placeholder="Ex: Você é um assistente de marketing experiente focado em venda de seminovos..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" /> Token Instagram (Long-Lived)
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
                  <p className="text-xs text-slate-500">
                    Este número será usado para os botões "Fale Conosco" gerados pela IA.
                  </p>
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
