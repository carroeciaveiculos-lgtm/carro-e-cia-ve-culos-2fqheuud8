import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Bot, Save, RotateCcw, Loader2, MapPin, AlertTriangle, Maximize2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  fetchAIPrompts,
  updateAIPrompt,
  restoreDefaultPrompt,
  DEPENDENTES_ASSISTENTE_INTERNO,
  type AIPromptConfig,
} from '@/services/ai-prompts'

const SEM_USO_MARCADOR = 'Nenhum lugar hoje'

function ApiBadge({ provider }: { provider: AIPromptConfig['api_provider'] }) {
  if (provider === 'gemini') {
    return (
      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
        API: Gemini
      </Badge>
    )
  }
  if (provider === 'openai') {
    return (
      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
        API: OpenAI
      </Badge>
    )
  }
  return null
}

function OndeFica({ texto }: { texto: string | null }) {
  if (!texto) return null
  const partes = texto.split('|').map((p) => p.trim()).filter(Boolean)
  if (partes.length <= 1) {
    return (
      <CardDescription className="text-xs mt-1 flex items-start gap-1.5">
        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>{texto}</span>
      </CardDescription>
    )
  }
  return (
    <div className="mt-1.5 space-y-1">
      <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
        <AlertTriangle className="h-3.5 w-3.5" />
        Usado em {partes.length} lugares diferentes — editar afeta todos:
      </span>
      <ul className="text-xs text-muted-foreground list-disc list-inside pl-1">
        {partes.map((parte, i) => (
          <li key={i}>{parte}</li>
        ))}
      </ul>
    </div>
  )
}

export default function PromptsIAPage() {
  const [prompts, setPrompts] = useState<AIPromptConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [clarModalOpen, setClaraModalOpen] = useState(false)

  const loadPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAIPrompts()
      setPrompts(data)
      const editMap: Record<string, string> = {}
      data.forEach((p) => {
        editMap[p.slug] = p.prompt_text
      })
      setEditing(editMap)
    } catch (err: any) {
      toast.error(`Erro ao carregar prompts: ${err?.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  const handleSave = async (slug: string) => {
    setSaving(slug)
    try {
      await updateAIPrompt(slug, editing[slug])
      setPrompts((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, prompt_text: editing[slug] } : p)),
      )
      toast.success('Regra atualizada com sucesso!')
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err?.message}`)
    } finally {
      setSaving(null)
    }
  }

  const handleRestore = async (slug: string) => {
    setRestoring(slug)
    try {
      await restoreDefaultPrompt(slug)
      const prompt = prompts.find((p) => p.slug === slug)
      if (prompt) {
        setEditing((prev) => ({ ...prev, [slug]: prompt.default_prompt }))
        setPrompts((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, prompt_text: prompt.default_prompt } : p)),
        )
      }
      toast.success('Regra restaurada para o padrão!')
    } catch (err: any) {
      toast.error(`Erro ao restaurar: ${err?.message}`)
    } finally {
      setRestoring(null)
    }
  }

  const isDirty = (slug: string) => {
    const prompt = prompts.find((p) => p.slug === slug)
    return prompt && editing[slug] !== prompt.prompt_text
  }

  const { ativos, semUso } = useMemo(() => {
    const ativos: AIPromptConfig[] = []
    const semUso: AIPromptConfig[] = []
    for (const p of prompts) {
      if (p.onde_fica?.startsWith(SEM_USO_MARCADOR)) semUso.push(p)
      else ativos.push(p)
    }
    return { ativos, semUso }
  }, [prompts])

  const nomesDependentesAssistente = useMemo(() => {
    return DEPENDENTES_ASSISTENTE_INTERNO.map(
      (slug) => prompts.find((p) => p.slug === slug)?.name || slug,
    ).join(', ')
  }, [prompts])

  const claraPrompt = prompts.find((p) => p.slug === 'sdr_whatsapp')

  const renderCard = (prompt: AIPromptConfig, opts?: { semUso?: boolean }) => {
    const isClara = prompt.slug === 'sdr_whatsapp'
    if (isClara) {
      return (
        <Card key={prompt.slug} className="border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {prompt.name}
                  {isDirty(prompt.slug) && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300"
                    >
                      Não salvo
                    </Badge>
                  )}
                </CardTitle>
                <OndeFica texto={prompt.onde_fica} />
              </div>
              <ApiBadge provider={prompt.api_provider} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Usado pela Clara para responder clientes reais no WhatsApp agora mesmo. Editar
                errado pode mudar como ela atende de verdade — abra o editor completo com
                cuidado.
              </span>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground font-mono max-h-24 overflow-hidden relative">
              {(editing[prompt.slug] || '').slice(0, 300)}...
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted/80 to-transparent" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {(editing[prompt.slug] || '').length} caracteres no total
              </span>
              <Button variant="outline" size="sm" onClick={() => setClaraModalOpen(true)}>
                <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                Abrir editor completo
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card key={prompt.slug} className={opts?.semUso ? 'opacity-70' : undefined}>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {prompt.name}
                {opts?.semUso && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                    Sem uso hoje
                  </Badge>
                )}
                {isDirty(prompt.slug) && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300"
                  >
                    Não salvo
                  </Badge>
                )}
              </CardTitle>
              <OndeFica texto={prompt.onde_fica} />
              {prompt.slug === 'ai_assistant' && nomesDependentesAssistente && (
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Esse texto também é a base usada por: {nomesDependentesAssistente} (quando
                    esses botões não têm regra própria).
                  </span>
                </div>
              )}
            </div>
            <ApiBadge provider={prompt.api_provider} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Regra que ele responde hoje
            </label>
            <Textarea
              value={editing[prompt.slug] || ''}
              onChange={(e) => setEditing((prev) => ({ ...prev, [prompt.slug]: e.target.value }))}
              className="min-h-[100px] font-mono text-sm"
              placeholder="Digite a regra..."
            />
          </div>
          {prompt.formato_resposta && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Formato de resposta fixo (protegido, não editável aqui)
              </label>
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                {prompt.formato_resposta}
              </div>
            </div>
          )}
          {prompt.rodape_fixo && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Texto fixo colado no final (protegido, não editável aqui)
              </label>
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                {prompt.rodape_fixo}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {(editing[prompt.slug] || '').length} caracteres
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestore(prompt.slug)}
                disabled={restoring === prompt.slug}
              >
                {restoring === prompt.slug ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Restaurar Padrão
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(prompt.slug)}
                disabled={saving === prompt.slug || !isDirty(prompt.slug)}
              >
                {saving === prompt.slug ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-7 w-7" />
          Regras de IA
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cada botão "Gerar com IA" do sistema tem sua própria regra aqui — edite e salve
          individualmente. A API usada (Gemini ou OpenAI) é fixa por tipo de conteúdo e não pode
          ser trocada nesta tela.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">{ativos.map((p) => renderCard(p))}</div>

          {semUso.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                  Sem uso hoje
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Esses cards existem no banco, mas nenhum código do sistema lê essa regra hoje —
                  editar aqui não muda nenhum comportamento real até serem reconectados.
                </p>
                <div className="space-y-4">{semUso.map((p) => renderCard(p, { semUso: true }))}</div>
              </div>
            </>
          )}
        </>
      )}

      <Dialog open={clarModalOpen} onOpenChange={setClaraModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editor completo — {claraPrompt?.name}</DialogTitle>
            <DialogDescription>
              Este texto é usado pela Clara para responder clientes reais no WhatsApp agora mesmo.
              Revise com calma antes de salvar.
            </DialogDescription>
          </DialogHeader>
          {claraPrompt && (
            <>
              <Textarea
                value={editing[claraPrompt.slug] || ''}
                onChange={(e) =>
                  setEditing((prev) => ({ ...prev, [claraPrompt.slug]: e.target.value }))
                }
                className="flex-1 min-h-[400px] font-mono text-xs"
              />
              <div className="text-xs text-muted-foreground">
                {(editing[claraPrompt.slug] || '').length} caracteres
              </div>
            </>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => claraPrompt && handleRestore(claraPrompt.slug)}
              disabled={!claraPrompt || restoring === claraPrompt.slug}
            >
              {claraPrompt && restoring === claraPrompt.slug ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Restaurar Padrão
            </Button>
            <Button
              onClick={async () => {
                if (!claraPrompt) return
                await handleSave(claraPrompt.slug)
                setClaraModalOpen(false)
              }}
              disabled={!claraPrompt || saving === claraPrompt.slug || !isDirty(claraPrompt.slug)}
            >
              {claraPrompt && saving === claraPrompt.slug ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
