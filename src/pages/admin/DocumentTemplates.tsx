import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { FileCode, Save, Eye, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  fetchDocumentTemplates,
  saveDocumentTemplate,
  renderTemplate,
  getSampleData,
  DOCUMENT_TYPES,
  TEMPLATE_MARKERS,
  type DocumentTemplate,
} from '@/services/document-templates'

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchDocumentTemplates()
      setTemplates(data)
      const map: Record<string, string> = {}
      data.forEach((t) => {
        map[t.document_type] = t.content
      })
      setEditing(map)
    } catch (err: any) {
      toast.error(`Erro ao carregar: ${err?.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async (docType: string) => {
    setSaving(docType)
    try {
      await saveDocumentTemplate(docType, editing[docType])
      setTemplates((prev) =>
        prev.map((t) => (t.document_type === docType ? { ...t, content: editing[docType] } : t)),
      )
      toast.success('Template salvo com sucesso!')
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err?.message}`)
    } finally {
      setSaving(null)
    }
  }

  const handlePreview = (docType: string) => {
    const tpl = templates.find((t) => t.document_type === docType)
    if (!tpl) return
    const rendered = renderTemplate(editing[docType] || '', getSampleData())
    setPreviewContent(rendered)
    setPreviewName(tpl.name)
  }

  const isDirty = (docType: string) => {
    const tpl = templates.find((t) => t.document_type === docType)
    return tpl && editing[docType] !== tpl.content
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileCode className="h-7 w-7" />
          Modelos de Documentos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os templates de documentos com marcadores dinâmicos.
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <p className="text-xs font-medium text-blue-700 mb-1">Marcadores disponíveis:</p>
          <div className="flex flex-wrap gap-1">
            {TEMPLATE_MARKERS.map((m) => (
              <Badge key={m} variant="secondary" className="text-[10px] font-mono">
                {`{{${m}}}`}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {DOCUMENT_TYPES.map((dt) => {
            const tpl = templates.find((t) => t.document_type === dt.type)
            return (
              <Card key={dt.type}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {dt.label}
                    {isDirty(dt.type) && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300"
                      >
                        Não salvo
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={editing[dt.type] || ''}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [dt.type]: e.target.value }))}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Digite o conteúdo do template..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {(editing[dt.type] || '').length} caracteres
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(dt.type)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(dt.type)}
                        disabled={saving === dt.type || !isDirty(dt.type)}
                      >
                        {saving === dt.type ? (
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
          })}
        </div>
      )}

      <Dialog open={!!previewContent} onOpenChange={(v) => !v && setPreviewContent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização — {previewName}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <pre className="text-sm whitespace-pre-wrap font-slate-700 p-2">{previewContent}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
