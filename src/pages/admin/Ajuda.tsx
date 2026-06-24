import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Search, HelpCircle, BookOpen, Bot, Sparkles, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useAiAssistant } from '@/hooks/use-ai-assistant'

interface AjudaConteudo {
  id: string
  categoria: string
  titulo: string
  o_que_e: string | null
  dependencias: string | null
  para_que_serve: string | null
  caminho: string | null
  quando_utilizar: string | null
  como_utilizar: string | null
  is_faq: boolean
}

export default function Ajuda() {
  const [conteudos, setConteudos] = useState<AjudaConteudo[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { generate, isLoading: isGenerating } = useAiAssistant()
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const { data } = await supabase.from('ajuda_conteudos').select('*').order('titulo')
      if (data) setConteudos(data)
      setLoading(false)
    }
    loadData()
  }, [])

  const filtered = conteudos.filter(
    (c) =>
      c.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (c.o_que_e && c.o_que_e.toLowerCase().includes(search.toLowerCase())),
  )

  const faqs = filtered.filter((c) => c.is_faq)
  const manuais = filtered.filter((c) => !c.is_faq)
  const categorias = Array.from(new Set(manuais.map((c) => c.categoria)))

  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return
    const answer = await generate(
      `O usuário tem uma dúvida sobre o sistema: "${aiQuestion}". Responda usando a base de conhecimento do manual. Se aplicável, estruture a resposta com: O que é, Para que serve e Como utilizar.`,
      'Página de Ajuda e Manuais do Sistema',
    )
    if (answer) setAiAnswer(answer)
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" /> Central de Ajuda & Manuais
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tire suas dúvidas e aprenda a utilizar todos os recursos do sistema com auxílio da IA.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="relative max-w-xl">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Busque por um tópico, módulo ou dúvida..."
              className="pl-10 h-12 text-base shadow-sm border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Tabs defaultValue="manuais" className="space-y-6">
            <TabsList className="bg-white border shadow-sm rounded-lg p-1">
              <TabsTrigger
                value="manuais"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <BookOpen className="w-4 h-4 mr-2" /> Manuais do Sistema
              </TabsTrigger>
              <TabsTrigger
                value="faq"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <HelpCircle className="w-4 h-4 mr-2" /> Dúvidas Frequentes (FAQ)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manuais" className="space-y-8">
              {loading ? (
                <div className="text-center py-12 text-slate-400 animate-pulse">
                  Carregando manuais...
                </div>
              ) : categorias.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Nenhum manual encontrado.</div>
              ) : (
                categorias.map((cat) => (
                  <div key={cat} className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{cat}</h3>
                    <Accordion type="single" collapsible className="w-full space-y-3">
                      {manuais
                        .filter((m) => m.categoria === cat)
                        .map((item) => (
                          <AccordionItem
                            key={item.id}
                            value={item.id}
                            className="bg-white border rounded-lg px-4 shadow-sm"
                          >
                            <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold text-slate-700">
                              {item.titulo}
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-6 text-slate-600 space-y-4 border-t mt-2">
                              {item.o_que_e && (
                                <div>
                                  <strong className="block text-slate-800 mb-1">O que é:</strong>
                                  <p className="text-sm leading-relaxed">{item.o_que_e}</p>
                                </div>
                              )}
                              {item.dependencias && (
                                <div>
                                  <strong className="block text-slate-800 mb-1">
                                    Dependências e Vínculos:
                                  </strong>
                                  <p className="text-sm leading-relaxed">{item.dependencias}</p>
                                </div>
                              )}
                              {item.para_que_serve && (
                                <div>
                                  <strong className="block text-slate-800 mb-1">
                                    Para que serve:
                                  </strong>
                                  <p className="text-sm leading-relaxed">{item.para_que_serve}</p>
                                </div>
                              )}
                              {item.caminho && (
                                <div>
                                  <strong className="block text-slate-800 mb-1">
                                    Onde está (caminho):
                                  </strong>
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {item.caminho}
                                  </Badge>
                                </div>
                              )}
                              {item.quando_utilizar && (
                                <div>
                                  <strong className="block text-slate-800 mb-1">
                                    Quando utilizar:
                                  </strong>
                                  <p className="text-sm leading-relaxed">{item.quando_utilizar}</p>
                                </div>
                              )}
                              {item.como_utilizar && (
                                <div className="bg-slate-50 p-4 rounded-md border mt-2">
                                  <strong className="block text-slate-800 mb-2">
                                    Como utilizar (Passo a passo):
                                  </strong>
                                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {item.como_utilizar}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </div>
                ))
              )}
            </TabsContent>

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
                          <AccordionContent className="text-slate-600 leading-relaxed pb-4">
                            {faq.como_utilizar || faq.o_que_e}
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
                qualquer função do sistema.
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
    </div>
  )
}
