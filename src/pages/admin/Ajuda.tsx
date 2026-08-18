import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import {
  Search,
  HelpCircle,
  BookOpen,
  Bot,
  Sparkles,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Workflow,
  Lock,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAiAssistant } from '@/hooks/use-ai-assistant'
import { useAuth } from '@/hooks/use-auth'
import { AjudaConteudo, listAjudaConteudos, apagarAjudaConteudo } from '@/services/ajuda'
import { Setor, listSetores } from '@/services/setores'
import { ManualFormModal } from '@/components/admin/ManualFormModal'
import { useToast } from '@/hooks/use-toast'

export default function Ajuda() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [conteudos, setConteudos] = useState<AjudaConteudo[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [setorFiltro, setSetorFiltro] = useState('todos')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [podeEditar, setPodeEditar] = useState(false)
  const [podeVerDevTi, setPodeVerDevTi] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [conteudoEmEdicao, setConteudoEmEdicao] = useState<AjudaConteudo | null>(null)
  const { generate, isLoading: isGenerating } = useAiAssistant()
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')

  const carregarConteudos = async () => {
    setLoading(true)
    const { data } = await listAjudaConteudos()
    setConteudos(data)
    setLoading(false)
  }

  useEffect(() => {
    carregarConteudos()
    listSetores().then(({ data }) => setSetores(data))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('usuarios')
      .select('nivel')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        // Editar/apagar conteúdo é exclusivo de admin_master (pedido da
        // Adriana, 18/08/2026). Ver Dev e TI (podeVerDevTi) é mais aberto —
        // admin_master e gerente — e continua controlado também pelo RLS.
        setPodeEditar(data?.nivel === 'admin_master')
        setPodeVerDevTi(data?.nivel === 'admin_master' || data?.nivel === 'gerente')
      })
  }, [user])

  const nomeSetor = (setorId: string | null) =>
    setores.find((s) => s.id === setorId)?.nome || 'Sem setor definido'

  const filtered = conteudos.filter((c) => {
    const bateSetor = setorFiltro === 'todos' || c.setor_id === setorFiltro
    const bateBusca =
      c.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (c.o_que_e && c.o_que_e.toLowerCase().includes(search.toLowerCase()))
    return bateSetor && bateBusca
  })

  const faqs = filtered.filter((c) => c.is_faq)
  const operacionais = filtered.filter((c) => !c.is_faq && c.grupo === 'operacional')
  const processos = filtered.filter((c) => !c.is_faq && c.grupo === 'processos')
  const devTi = filtered.filter((c) => !c.is_faq && c.grupo === 'dev_ti')
  const categoriasOperacional = Array.from(new Set(operacionais.map((c) => c.categoria)))
  const categoriasDevTi = Array.from(new Set(devTi.map((c) => c.categoria)))

  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return
    const answer = await generate(
      `O usuário tem uma dúvida sobre o sistema ou os processos da empresa: "${aiQuestion}". Responda usando a base de conhecimento do manual. Se aplicável, estruture a resposta com: O que é, Para que serve e Como utilizar.`,
      'Página de Ajuda e Manuais do Sistema',
    )
    if (answer) setAiAnswer(answer)
  }

  const handleNovoManual = () => {
    setConteudoEmEdicao(null)
    setModalAberto(true)
  }

  const handleEditar = (conteudo: AjudaConteudo) => {
    setConteudoEmEdicao(conteudo)
    setModalAberto(true)
  }

  const handleApagar = async (conteudo: AjudaConteudo) => {
    if (!confirm(`Apagar "${conteudo.titulo}"? Essa ação não pode ser desfeita.`)) return
    const { error } = await apagarAjudaConteudo(conteudo.id)
    if (error) {
      toast({ title: 'Erro ao apagar', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Manual apagado' })
    carregarConteudos()
  }

  const renderManualItem = (item: AjudaConteudo) => (
    <AccordionItem key={item.id} value={item.id} className="bg-white border rounded-lg px-4 shadow-sm">
      <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold text-slate-700">
        <div className="flex items-center gap-3 flex-1">
          <span>{item.titulo}</span>
          <Badge variant="outline" className="font-normal text-xs">
            {nomeSetor(item.setor_id)}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-6 text-slate-600 space-y-4 border-t mt-2">
        {podeEditar && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => handleEditar(item)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleApagar(item)}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Apagar
            </Button>
          </div>
        )}
        {item.o_que_e && (
          <div>
            <strong className="block text-slate-800 mb-1">O que é:</strong>
            <p className="text-sm leading-relaxed">{item.o_que_e}</p>
          </div>
        )}
        {item.dependencias && (
          <div>
            <strong className="block text-slate-800 mb-1">Dependências e Vínculos:</strong>
            <p className="text-sm leading-relaxed">{item.dependencias}</p>
          </div>
        )}
        {item.para_que_serve && (
          <div>
            <strong className="block text-slate-800 mb-1">Para que serve:</strong>
            <p className="text-sm leading-relaxed">{item.para_que_serve}</p>
          </div>
        )}
        {item.caminho && (
          <div>
            <strong className="block text-slate-800 mb-1">Onde está (caminho):</strong>
            <Badge variant="secondary" className="font-mono text-xs">
              {item.caminho}
            </Badge>
          </div>
        )}
        {item.quando_utilizar && (
          <div>
            <strong className="block text-slate-800 mb-1">Quando utilizar:</strong>
            <p className="text-sm leading-relaxed">{item.quando_utilizar}</p>
          </div>
        )}
        {item.como_utilizar && (
          <div className="bg-slate-50 p-4 rounded-md border mt-2">
            <strong className="block text-slate-800 mb-2">Como utilizar (Passo a passo):</strong>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{item.como_utilizar}</div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )

  const renderGrupoPorCategoria = (items: AjudaConteudo[], categorias: string[], vazio: string) =>
    loading ? (
      <div className="text-center py-12 text-slate-400 animate-pulse">Carregando...</div>
    ) : categorias.length === 0 ? (
      <div className="text-center py-12 text-slate-400">{vazio}</div>
    ) : (
      categorias.map((cat) => (
        <div key={cat} className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{cat}</h3>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {items.filter((m) => m.categoria === cat).map(renderManualItem)}
          </Accordion>
        </div>
      ))
    )

  const renderProcessos = () => {
    const setorIds = Array.from(new Set(processos.map((p) => p.setor_id)))
    return loading ? (
      <div className="text-center py-12 text-slate-400 animate-pulse">Carregando...</div>
    ) : setorIds.length === 0 ? (
      <div className="text-center py-12 text-slate-400">
        Nenhum processo cadastrado ainda. Processos descrevem o fluxo de trabalho de um setor
        (vendas, financiamento, consórcio, seguro, documentos, parceiros, consignação) — peça pra
        criar o primeiro quando quiser documentar um desses fluxos.
      </div>
    ) : (
      setorIds.map((setorId) => (
        <div key={setorId || 'sem-setor'} className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{nomeSetor(setorId)}</h3>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {processos.filter((p) => p.setor_id === setorId).map(renderManualItem)}
          </Accordion>
        </div>
      ))
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Central de Ajuda, Manuais e POPs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consulte processos, procedimentos e manuais do sistema por setor, com auxílio da IA.
          </p>
        </div>
        {podeEditar && (
          <Button onClick={handleNovoManual}>
            <Plus className="w-4 h-4 mr-2" /> Novo Manual/POP
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Busque por um tópico, módulo ou dúvida..."
                className="pl-10 h-12 text-base shadow-sm border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={setorFiltro} onValueChange={setSetorFiltro}>
              <SelectTrigger className="w-full sm:w-56 h-12 shadow-sm border-slate-200">
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {setores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="operacional" className="space-y-6">
            <TabsList className="bg-white border shadow-sm rounded-lg p-1 flex-wrap h-auto">
              <TabsTrigger
                value="operacional"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <BookOpen className="w-4 h-4 mr-2" /> Operacional
              </TabsTrigger>
              <TabsTrigger
                value="processos"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Workflow className="w-4 h-4 mr-2" /> Processos
              </TabsTrigger>
              {podeVerDevTi && (
                <TabsTrigger
                  value="dev_ti"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Lock className="w-4 h-4 mr-2" /> Dev e TI
                </TabsTrigger>
              )}
              <TabsTrigger
                value="faq"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <HelpCircle className="w-4 h-4 mr-2" /> Dúvidas Frequentes (FAQ)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="operacional" className="space-y-8">
              {renderGrupoPorCategoria(operacionais, categoriasOperacional, 'Nenhum manual encontrado.')}
            </TabsContent>

            <TabsContent value="processos" className="space-y-8">
              {renderProcessos()}
            </TabsContent>

            {podeVerDevTi && (
              <TabsContent value="dev_ti" className="space-y-8">
                <p className="text-xs text-slate-400 -mt-2">
                  Conteúdo técnico visível só pra admin_master e gerente.
                </p>
                {renderGrupoPorCategoria(
                  devTi,
                  categoriasDevTi,
                  'Nenhuma documentação técnica encontrada.',
                )}
              </TabsContent>
            )}

            <TabsContent value="faq">
              <Card className="border-none shadow-sm">
                <CardHeader className="bg-slate-50 border-b rounded-t-xl">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-500" /> FAQ de Dúvidas Frequentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {loading ? (
                    <div className="text-center py-12 text-slate-400 animate-pulse">
                      Carregando...
                    </div>
                  ) : faqs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      Nenhuma dúvida cadastrada.
                    </div>
                  ) : (
                    <Accordion type="multiple" className="w-full space-y-3">
                      {faqs.map((faq) => (
                        <AccordionItem
                          key={faq.id}
                          value={faq.id}
                          className="border rounded-lg px-4 hover:bg-slate-50 transition-colors"
                        >
                          <AccordionTrigger className="hover:no-underline text-left py-4 font-medium text-slate-800">
                            {faq.titulo}
                          </AccordionTrigger>
                          <AccordionContent className="text-slate-600 leading-relaxed pb-4 space-y-3">
                            <p>{faq.como_utilizar || faq.o_que_e}</p>
                            {podeEditar && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditar(faq)}
                                >
                                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApagar(faq)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Apagar
                                </Button>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className="border-purple-100 shadow-md bg-gradient-to-b from-white to-purple-50/30 sticky top-8">
            <CardHeader className="pb-4 border-b border-purple-100/50">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Bot className="w-5 h-5" /> Assistente IA
              </CardTitle>
              <CardDescription className="text-purple-600/80">
                Não encontrou o que procurava? Pergunte para a nossa inteligência artificial sobre
                qualquer função do sistema ou processo da empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea
                placeholder="Ex: Como eu faço para cadastrar um novo veículo no estoque?"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className="min-h-[100px] resize-none border-purple-200 focus-visible:ring-purple-500"
              />
              <Button
                onClick={handleAskAi}
                disabled={isGenerating || !aiQuestion.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Perguntar à IA
              </Button>

              {aiAnswer && (
                <div className="mt-6 p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-purple-800">
                    <Sparkles className="w-4 h-4" /> Resposta:
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {aiAnswer}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ManualFormModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        conteudo={conteudoEmEdicao}
        onSuccess={carregarConteudos}
      />
    </div>
  )
}
