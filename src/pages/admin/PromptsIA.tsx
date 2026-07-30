import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Bot, Save, RotateCcw, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchAIPrompts,
  updateAIPrompt,
  restoreDefaultPrompt,
  type AIPromptConfig,
} from '@/services/ai-prompts'

export default function PromptsIAPage() {
  const [prompts, setPrompts] = useState<AIPromptConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)

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
      toast.success('Prompt atualizado com sucesso!')
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
      toast.success('Prompt restaurado para o padrão!')
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

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-7 w-7" />
          Gerenciamento de Prompts IA
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure os prompts dos agentes de inteligência artificial do sistema.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <Card key={prompt.slug}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
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
                    {prompt.description && (
                      <CardDescription className="text-xs mt-1">
                        {prompt.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={editing[prompt.slug] || ''}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [prompt.slug]: e.target.value }))
                  }
                  className="min-h-[120px] font-mono text-sm"
                  placeholder="Digite o prompt do agente..."
                />
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
          ))}
        </div>
      )}
    </div>
  )
}
