import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Download,
  Printer,
  FileSignature,
  Search,
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  Loader2,
  Folder,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

export default function Administrativo() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadData, setUploadData] = useState({ titulo: '', veiculo_id: '' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [quickDocVeiculoId, setQuickDocVeiculoId] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    fetchDocuments()
    fetchVeiculos()
  }, [])

  // Pré-seleciona o veículo no emissor de contrato quando vem da tela de
  // Avaliação de Veículo (17/08/2026) já com o cadastro criado.
  useEffect(() => {
    const veiculoId = searchParams.get('veiculo')
    if (veiculoId) {
      setQuickDocVeiculoId(veiculoId)
      const next = new URLSearchParams(searchParams)
      next.delete('veiculo')
      setSearchParams(next, { replace: true })
    }
  }, [])

  const fetchVeiculos = async () => {
    const { data } = await supabase
      .from('veiculos')
      .select('id, placa, modelo')
      .order('created_at', { ascending: false })
    if (data) setVeiculos(data)
  }

  const fetchDocuments = async () => {
    setLoadingList(true)
    try {
      const [docsRes, nfsRes, contratosRes] = await Promise.all([
        supabase.from('documentos').select('*, veiculos(placa, modelo)'),
        supabase.from('notas_fiscais').select('*, veiculos(placa, modelo)'),
        supabase.from('contratos_consignacao').select('*, veiculos(placa, modelo)'),
      ])

      const combined: any[] = []

      docsRes.data?.forEach((d) => {
        combined.push({
          id: d.id,
          tipo: 'Documento de Veículo',
          titulo: d.nome_documento,
          veiculo: d.veiculos ? `${d.veiculos.modelo} (${d.veiculos.placa})` : '-',
          cliente: '-',
          url: d.url_documento,
          created_at: d.created_at,
          source: 'documentos',
        })
      })

      nfsRes.data?.forEach((d) => {
        if (d.pdf_url) {
          combined.push({
            id: d.id,
            tipo: 'Nota Fiscal',
            titulo: `NF ${d.numero_nota || 'Sem Número'}`,
            veiculo: d.veiculos ? `${d.veiculos.modelo} (${d.veiculos.placa})` : '-',
            cliente: d.cliente_nome || '-',
            url: d.pdf_url,
            created_at: d.created_at,
            source: 'notas_fiscais',
          })
        }
      })

      contratosRes.data?.forEach((d) => {
        if (d.pdf_url) {
          combined.push({
            id: d.id,
            tipo: 'Contrato',
            titulo: `Contrato ${d.numero_contrato || ''}`,
            veiculo: d.veiculos ? `${d.veiculos.modelo} (${d.veiculos.placa})` : '-',
            cliente: d.proprietario_nome || '-',
            url: d.pdf_url,
            created_at: d.created_at,
            source: 'contratos_consignacao',
          })
        }
      })

      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setDocuments(combined)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingList(false)
    }
  }

  const gerarDocumento = async (tipo: string) => {
    if (!quickDocVeiculoId) {
      toast({
        variant: 'destructive',
        title: 'Selecione um veículo',
        description: 'Escolha um veículo para gerar o documento.',
      })
      return
    }
    setLoading(tipo)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-contrato', {
        body: { veiculo_id: quickDocVeiculoId },
      })
      if (error) throw error
      if (data?.html) {
        const blob = new Blob([data.html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${tipo}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
      toast({
        title: 'Documento gerado',
        description: `O documento de ${tipo.replace('_', ' ')} foi gerado com sucesso.`,
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar documento',
        description: 'Tente novamente mais tarde.',
      })
    } finally {
      setLoading(null)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadData.titulo)
      return toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
    setUploading(true)
    try {
      const fileName = `${Date.now()}_${uploadFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const filePath = `gerais/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documentos-veiculos')
        .upload(filePath, uploadFile)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('documentos-veiculos')
        .getPublicUrl(filePath)

      await supabase.from('documentos').insert({
        nome_documento: uploadData.titulo,
        url_documento: publicUrlData.publicUrl,
        veiculo_id: uploadData.veiculo_id || null,
        tipo: uploadFile.type,
        tamanho: uploadFile.size,
      })

      toast({ title: 'Documento salvo com sucesso!' })
      setIsUploadOpen(false)
      setUploadFile(null)
      setUploadData({ titulo: '', veiculo_id: '' })
      fetchDocuments()
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, source: string) => {
    if (!confirm('Deseja realmente excluir este documento?')) return
    try {
      if (source === 'documentos') {
        await supabase.from('documentos').delete().eq('id', id)
      } else {
        toast({
          title: 'Apenas documentos avulsos podem ser excluídos por aqui.',
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Documento excluído.' })
      fetchDocuments()
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    }
  }

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      const matchSearch = (d.titulo + d.veiculo + d.cliente)
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchCat = categoryFilter === 'Todos' || d.tipo === categoryFilter
      return matchSearch && matchCat
    })
  }, [documents, search, categoryFilter])

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Hub de Documentos</h2>
        <p className="text-muted-foreground">
          Gestão centralizada de contratos, recibos e documentos da loja.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-blue-600" /> Modelos Rápidos
            </CardTitle>
            <CardDescription>Gere documentos em branco rapidamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={quickDocVeiculoId} onValueChange={setQuickDocVeiculoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um veículo..." />
              </SelectTrigger>
              <SelectContent>
                {veiculos.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.modelo} ({v.placa})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => gerarDocumento('compra')}
                disabled={loading === 'compra'}
              >
                <FileText className="mr-2 h-4 w-4" /> Compra
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => gerarDocumento('venda')}
                disabled={loading === 'venda'}
              >
                <FileText className="mr-2 h-4 w-4" /> Venda
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => gerarDocumento('recibo_sinal')}
                disabled={loading === 'recibo_sinal'}
              >
                <Printer className="mr-2 h-4 w-4" /> Sinal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => gerarDocumento('termo_entrega')}
                disabled={loading === 'termo_entrega'}
              >
                <Download className="mr-2 h-4 w-4" /> Entrega
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-t-4 border-t-blue-600 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" /> Repositório Central
            </CardTitle>
            <CardDescription>Todos os arquivos gerados e anexados no sistema.</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Buscar por placa, cliente ou nome..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Contrato">Contratos</SelectItem>
                <SelectItem value="Nota Fiscal">Notas Fiscais</SelectItem>
                <SelectItem value="Documento de Veículo">Docs. Veículos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Anexo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Veículo Relacionado</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Nenhum documento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocs.map((doc) => (
                      <TableRow key={`${doc.source}-${doc.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {doc.titulo}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                            {doc.tipo}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600">{doc.veiculo}</TableCell>
                        <TableCell className="text-slate-600">{doc.cliente}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(doc.url, '_blank')}
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                            {doc.source === 'documentos' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(doc.id, doc.source)}
                                className="text-red-500 hover:bg-red-50"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Documento Avulso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome/Título do Documento *</Label>
              <Input
                value={uploadData.titulo}
                onChange={(e) => setUploadData({ ...uploadData, titulo: e.target.value })}
                placeholder="Ex: CRLV 2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Vincular a Veículo (Opcional)</Label>
              <Select
                value={uploadData.veiculo_id}
                onValueChange={(v) => setUploadData({ ...uploadData, veiculo_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um veículo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {veiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.modelo} ({v.placa})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arquivo *</Label>
              <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
