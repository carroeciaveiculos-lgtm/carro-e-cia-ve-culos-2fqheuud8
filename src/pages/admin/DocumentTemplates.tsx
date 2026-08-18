import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { FileCode, Save, Eye, Loader2, FileSignature, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AssinaturaDialog } from '@/components/consignacao/AssinaturaDialog'
import { getVeiculos, type Veiculo } from '@/services/veiculos'
import { supabase } from '@/lib/supabase/client'
import {
  fetchDocumentTemplates,
  saveDocumentTemplate,
  renderTemplate,
  getSampleData,
  DOCUMENT_TYPES,
  TEMPLATE_MARKERS,
  type DocumentTemplate,
} from '@/services/document-templates'

const CONTRACT_DOC_TYPES = DOCUMENT_TYPES.filter((dt) =>
  ['consignacao', 'compra', 'venda', 'termo_entrega'].includes(dt.type),
)

interface DocumentoGerado {
  contrato_id: string
  url: string | null
  numero_contrato: string
}

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState('')

  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [gerarVeiculoId, setGerarVeiculoId] = useState('')
  const [gerarDocType, setGerarDocType] = useState('venda')
  const [gerarNome, setGerarNome] = useState('')
  const [gerarEmail, setGerarEmail] = useState('')
  const [gerarTelefone, setGerarTelefone] = useState('')
  const [gerarCpf, setGerarCpf] = useState('')
  const [gerando, setGerando] = useState(false)
  const [documentoGerado, setDocumentoGerado] = useState<DocumentoGerado | null>(null)

  useEffect(() => {
    getVeiculos().then(({ data }) => setVeiculos(data || []))
  }, [])

  useEffect(() => {
    const v = veiculos.find((v) => v.id === gerarVeiculoId) as any
    if (v) {
      setGerarNome(v.proprietario_nome || '')
      setGerarEmail(v.proprietario_email || '')
      setGerarTelefone(v.proprietario_telefone || '')
      setGerarCpf(v.proprietario_cpf || '')
    }
  }, [gerarVeiculoId, veiculos])

  const handleGerarDocumento = async () => {
    if (!gerarNome.trim()) {
      toast.error('Informe o nome do cliente')
      return
    }
    setGerando(true)
    setDocumentoGerado(null)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-contrato', {
        body: {
          veiculo_id: gerarVeiculoId || undefined,
          document_type: gerarDocType,
          proprietario_nome: gerarNome,
          proprietario_email: gerarEmail || undefined,
          proprietario_telefone: gerarTelefone || undefined,
          proprietario_cpf: gerarCpf || undefined,
        },
      })
      if (error) throw new Error(error.message)
      if (!data?.success) throw new Error(data?.error || 'Falha ao gerar documento')

      setDocumentoGerado({
        contrato_id: data.contrato_id,
        url: data.url,
        numero_contrato: data.numero_contrato,
      })
      toast.success(`${data.document_name} gerado (${data.numero_contrato})`)
    } catch (err: any) {
      toast.error(`Erro ao gerar documento: ${err.message}`)
    } finally {
      setGerando(false)
    }
  }

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Gerar Documento de Contrato
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Gera o PDF de um contrato de verdade (venda, compra, consignação ou termo de entrega)
            a partir do template acima, e libera as opções de assinatura — física (baixar e
            imprimir) ou eletrônica via Autentique (link por WhatsApp/e-mail).
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de documento</Label>
              <Select value={gerarDocType} onValueChange={setGerarDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_DOC_TYPES.map((dt) => (
                    <SelectItem key={dt.type} value={dt.type}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Veículo (opcional)</Label>
              <Select value={gerarVeiculoId} onValueChange={setGerarVeiculoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {veiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.marca} {v.modelo} — {v.placa || 'sem placa'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do cliente *</Label>
              <Input value={gerarNome} onChange={(e) => setGerarNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail do cliente</Label>
              <Input
                type="email"
                value={gerarEmail}
                onChange={(e) => setGerarEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone / WhatsApp</Label>
              <Input value={gerarTelefone} onChange={(e) => setGerarTelefone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CPF</Label>
              <Input value={gerarCpf} onChange={(e) => setGerarCpf(e.target.value)} />
            </div>
          </div>

          <Button onClick={handleGerarDocumento} disabled={gerando}>
            {gerando ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileSignature className="h-3.5 w-3.5 mr-1.5" />
            )}
            Gerar Documento
          </Button>

          {documentoGerado && (
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg mt-2">
              <p className="text-sm text-slate-700">
                <strong>{documentoGerado.numero_contrato}</strong> gerado com sucesso.
              </p>
              <div className="flex gap-2">
                {documentoGerado.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={documentoGerado.url} target="_blank" rel="noreferrer">
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar PDF
                    </a>
                  </Button>
                )}
                <AssinaturaDialog
                  contratoId={documentoGerado.contrato_id}
                  emailCliente={gerarEmail}
                  nomeCliente={gerarNome}
                  proprietarioTelefone={gerarTelefone}
                  proprietarioCpf={gerarCpf}
                  numeroContrato={documentoGerado.numero_contrato}
                  pdfUrl={documentoGerado.url || undefined}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
