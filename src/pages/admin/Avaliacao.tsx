import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Plus, FileText, Car, Ban, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { resizeImages } from '@/lib/image-resize'
import { uploadToR2 } from '@/lib/r2-upload'
import {
  fetchAvaliacoes,
  fetchAgendamentosAvaliacaoPendentes,
  buscarLeadsPorNomeOuTelefone,
  criarLeadAvulso,
  createAvaliacao,
  marcarRecusado,
  gerarPropostaAvaliacao,
  marcarConsignacaoOuCompra,
  type AvaliacaoVeiculo,
} from '@/services/avaliacoes'

const DESTINO_LABEL: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-slate-100 text-slate-600' },
  proposta_enviada: { label: 'Proposta enviada', className: 'bg-blue-100 text-blue-700' },
  consignacao: { label: 'Virou consignação', className: 'bg-purple-100 text-purple-700' },
  compra_estoque: { label: 'Virou estoque', className: 'bg-green-100 text-green-700' },
  recusado: { label: 'Recusado', className: 'bg-red-100 text-red-700' },
}

const CAMBIOS = ['Manual', 'Automático', 'Automatizado', 'CVT']
const COMBUSTIVEIS = ['Flex', 'Gasolina', 'Diesel', 'Híbrido', 'Elétrico', 'GNV']

export default function Avaliacao() {
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoVeiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroDestino, setFiltroDestino] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [processando, setProcessando] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAvaliacoes(await fetchAvaliacoes())
    } catch (err: any) {
      toast({ title: 'Erro ao carregar avaliações', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const avaliacoesFiltradas =
    filtroDestino === 'todos' ? avaliacoes : avaliacoes.filter((a) => a.destino === filtroDestino)

  const handleGerarPdf = async (id: string) => {
    setProcessando(id)
    try {
      const url = await gerarPropostaAvaliacao(id)
      window.open(url, '_blank')
      toast({ title: 'Proposta gerada' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro ao gerar proposta', description: err.message, variant: 'destructive' })
    } finally {
      setProcessando(null)
    }
  }

  const handleMarcarDestino = async (avaliacao: AvaliacaoVeiculo, destino: 'consignacao' | 'compra_estoque') => {
    setProcessando(avaliacao.id)
    try {
      const veiculoId = await marcarConsignacaoOuCompra(avaliacao, destino)
      toast({
        title: destino === 'consignacao' ? 'Cadastro de consignação criado' : 'Cadastro de estoque criado',
        description: 'Complete os dados que faltam (fotos de anúncio, preço) no cadastro do veículo.',
      })
      load()
      if (destino === 'compra_estoque') {
        navigate(`/admin/estoque?editar=${veiculoId}`)
      } else {
        navigate(`/admin/administrativo?veiculo=${veiculoId}`)
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setProcessando(null)
    }
  }

  const handleRecusar = async (id: string) => {
    setProcessando(id)
    try {
      await marcarRecusado(id)
      toast({ title: 'Avaliação marcada como recusada' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setProcessando(null)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Avaliação de Veículo
          </h1>
          <p className="text-sm text-gray-500">
            Registre a avaliação de um carro trazido por um cliente pra vender/trocar.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Nova Avaliação
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm text-gray-500">Filtrar:</Label>
        <Select value={filtroDestino} onValueChange={setFiltroDestino}>
          <SelectTrigger className="w-[220px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(DESTINO_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-semibold">Cliente</TableCell>
              <TableCell className="font-semibold">Veículo</TableCell>
              <TableCell className="font-semibold">Valor proposto</TableCell>
              <TableCell className="font-semibold">Status</TableCell>
              <TableCell className="font-semibold">Data</TableCell>
              <TableCell className="font-semibold text-right">Ações</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : avaliacoesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                  Nenhuma avaliação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              avaliacoesFiltradas.map((a) => {
                const destino = DESTINO_LABEL[a.destino]
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{a.leads?.nome || '—'}</div>
                      <div className="text-xs text-gray-400">{a.leads?.telefone}</div>
                    </TableCell>
                    <TableCell>
                      {a.marca} {a.modelo}
                      <div className="text-xs text-gray-400">
                        {a.ano_fabricacao}/{a.ano_modelo} · {a.placa || 'sem placa'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.valor_proposto
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            a.valor_proposto,
                          )
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={destino.className}>{destino.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={processando === a.id}
                          onClick={() => handleGerarPdf(a.id)}
                          title="Gerar proposta em PDF"
                        >
                          <FileText className="w-3 h-3" />
                        </Button>
                        {a.destino !== 'consignacao' && a.destino !== 'compra_estoque' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={processando === a.id}
                              onClick={() => handleMarcarDestino(a, 'consignacao')}
                              title="Marcar como consignação"
                            >
                              <ClipboardCheck className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={processando === a.id}
                              onClick={() => handleMarcarDestino(a, 'compra_estoque')}
                              title="Marcar como compra (vira estoque)"
                            >
                              <Car className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              disabled={processando === a.id}
                              onClick={() => handleRecusar(a.id)}
                              title="Marcar como recusado"
                            >
                              <Ban className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <NovaAvaliacaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        avaliadorId={user?.id}
        onCreated={load}
      />
    </div>
  )
}

function NovaAvaliacaoModal({
  open,
  onOpenChange,
  avaliadorId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  avaliadorId?: string
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [origem, setOrigem] = useState<'agendamento' | 'avulsa'>('avulsa')
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null)

  const [buscaLead, setBuscaLead] = useState('')
  const [leadsEncontrados, setLeadsEncontrados] = useState<any[]>([])
  const [leadSelecionado, setLeadSelecionado] = useState<any>(null)
  const [novoLeadNome, setNovoLeadNome] = useState('')
  const [novoLeadTelefone, setNovoLeadTelefone] = useState('')

  const [form, setForm] = useState({
    marca: '',
    modelo: '',
    ano_fabricacao: '',
    ano_modelo: '',
    placa: '',
    quilometragem: '',
    cor: '',
    cambio: '',
    combustivel: '',
    estado_conservacao: '',
    itens_opcionais: '',
    tem_debito_multa_sinistro: false,
    observacao_debito: '',
    valor_proposto: '',
    observacoes: '',
  })
  const [fotos, setFotos] = useState<string[]>([])
  const [enviandoFotos, setEnviandoFotos] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (open && origem === 'agendamento') {
      fetchAgendamentosAvaliacaoPendentes().then(setAgendamentos).catch(console.error)
    }
  }, [open, origem])

  useEffect(() => {
    if (!open) {
      // reset ao fechar
      setOrigem('avulsa')
      setAgendamentoSelecionado(null)
      setBuscaLead('')
      setLeadsEncontrados([])
      setLeadSelecionado(null)
      setNovoLeadNome('')
      setNovoLeadTelefone('')
      setFotos([])
      setForm({
        marca: '',
        modelo: '',
        ano_fabricacao: '',
        ano_modelo: '',
        placa: '',
        quilometragem: '',
        cor: '',
        cambio: '',
        combustivel: '',
        estado_conservacao: '',
        itens_opcionais: '',
        tem_debito_multa_sinistro: false,
        observacao_debito: '',
        valor_proposto: '',
        observacoes: '',
      })
    }
  }, [open])

  const handleBuscarLead = async (termo: string) => {
    setBuscaLead(termo)
    setLeadSelecionado(null)
    if (termo.trim().length < 3) {
      setLeadsEncontrados([])
      return
    }
    try {
      setLeadsEncontrados(await buscarLeadsPorNomeOuTelefone(termo))
    } catch (err) {
      console.error(err)
    }
  }

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[]
    if (!files.length) return
    setEnviandoFotos(true)
    try {
      const resized = await resizeImages(files)
      const pasta = `avaliacoes/${Date.now()}`
      const novas: string[] = []
      for (let i = 0; i < resized.length; i++) {
        const blob = resized[i]
        const ext = blob.type.includes('png') ? 'png' : 'jpg'
        const { publicUrl } = await uploadToR2(blob, `${pasta}/${i}.${ext}`, blob.type || 'image/jpeg', 'media')
        novas.push(publicUrl)
      }
      setFotos((prev) => [...prev, ...novas])
    } catch (err: any) {
      toast({ title: 'Erro ao enviar fotos', description: err.message, variant: 'destructive' })
    } finally {
      setEnviandoFotos(false)
      e.target.value = ''
    }
  }

  const handleSalvar = async () => {
    let leadId: string | null = null

    if (origem === 'agendamento') {
      if (!agendamentoSelecionado) {
        return toast({ title: 'Selecione um agendamento', variant: 'destructive' })
      }
      leadId = agendamentoSelecionado.lead_id
    } else {
      if (leadSelecionado) {
        leadId = leadSelecionado.id
      } else if (novoLeadNome && novoLeadTelefone) {
        try {
          const novo = await criarLeadAvulso(novoLeadNome, novoLeadTelefone)
          leadId = novo.id
        } catch (err: any) {
          return toast({ title: 'Erro ao criar lead', description: err.message, variant: 'destructive' })
        }
      } else {
        return toast({
          title: 'Escolha um cliente existente ou preencha nome e telefone',
          variant: 'destructive',
        })
      }
    }

    if (!form.marca || !form.modelo) {
      return toast({ title: 'Marca e modelo são obrigatórios', variant: 'destructive' })
    }

    setSalvando(true)
    try {
      await createAvaliacao({
        lead_id: leadId!,
        agendamento_id: origem === 'agendamento' ? agendamentoSelecionado.id : null,
        avaliador_id: avaliadorId || null,
        marca: form.marca,
        modelo: form.modelo,
        ano_fabricacao: form.ano_fabricacao ? Number(form.ano_fabricacao) : null,
        ano_modelo: form.ano_modelo ? Number(form.ano_modelo) : null,
        placa: form.placa || null,
        quilometragem: form.quilometragem ? Number(form.quilometragem) : null,
        cor: form.cor || null,
        cambio: form.cambio || null,
        combustivel: form.combustivel || null,
        estado_conservacao: form.estado_conservacao || null,
        itens_opcionais: form.itens_opcionais
          ? form.itens_opcionais.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
        tem_debito_multa_sinistro: form.tem_debito_multa_sinistro,
        observacao_debito: form.observacao_debito || null,
        fotos: fotos.length ? fotos : null,
        valor_proposto: form.valor_proposto ? Number(form.valor_proposto) : null,
        observacoes: form.observacoes || null,
      })
      toast({ title: 'Avaliação registrada com sucesso' })
      onOpenChange(false)
      onCreated()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Avaliação de Veículo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Como essa avaliação começou?</Label>
            <div className="flex gap-2 mt-1.5">
              <Button
                type="button"
                variant={origem === 'agendamento' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrigem('agendamento')}
              >
                A partir de um agendamento
              </Button>
              <Button
                type="button"
                variant={origem === 'avulsa' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrigem('avulsa')}
              >
                Avulsa (cliente na loja agora)
              </Button>
            </div>
          </div>

          {origem === 'agendamento' ? (
            <div>
              <Label className="text-sm">Agendamento de avaliação pendente</Label>
              <Select
                value={agendamentoSelecionado?.id || ''}
                onValueChange={(v) => setAgendamentoSelecionado(agendamentos.find((a) => a.id === v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um agendamento" />
                </SelectTrigger>
                <SelectContent>
                  {agendamentos.length === 0 && (
                    <div className="p-2 text-xs text-gray-400">Nenhum agendamento pendente</div>
                  )}
                  {agendamentos.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.leads?.nome || 'Sem nome'} — {new Date(a.data_hora).toLocaleString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm">Cliente</Label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  className="pl-8"
                  value={buscaLead}
                  onChange={(e) => handleBuscarLead(e.target.value)}
                />
              </div>
              {leadsEncontrados.length > 0 && !leadSelecionado && (
                <div className="border rounded-md divide-y">
                  {leadsEncontrados.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      className="w-full text-left p-2 text-sm hover:bg-slate-50"
                      onClick={() => {
                        setLeadSelecionado(l)
                        setBuscaLead(`${l.nome} — ${l.telefone || ''}`)
                        setLeadsEncontrados([])
                      }}
                    >
                      {l.nome} — {l.telefone}
                    </button>
                  ))}
                </div>
              )}
              {!leadSelecionado && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Input
                    placeholder="Ou nome do novo cliente"
                    value={novoLeadNome}
                    onChange={(e) => setNovoLeadNome(e.target.value)}
                  />
                  <Input
                    placeholder="Telefone"
                    value={novoLeadTelefone}
                    onChange={(e) => setNovoLeadTelefone(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4 grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Marca *</Label>
              <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Modelo *</Label>
              <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Ano fabricação</Label>
              <Input
                type="number"
                value={form.ano_fabricacao}
                onChange={(e) => setForm({ ...form, ano_fabricacao: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Ano modelo</Label>
              <Input
                type="number"
                value={form.ano_modelo}
                onChange={(e) => setForm({ ...form, ano_modelo: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Placa</Label>
              <Input value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Km</Label>
              <Input
                type="number"
                value={form.quilometragem}
                onChange={(e) => setForm({ ...form, quilometragem: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Cor</Label>
              <Input value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Câmbio</Label>
              <Select value={form.cambio} onValueChange={(v) => setForm({ ...form, cambio: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CAMBIOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Combustível</Label>
              <Select value={form.combustivel} onValueChange={(v) => setForm({ ...form, combustivel: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {COMBUSTIVEIS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor proposto (R$)</Label>
              <Input
                type="number"
                value={form.valor_proposto}
                onChange={(e) => setForm({ ...form, valor_proposto: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Estado de conservação</Label>
            <Textarea
              value={form.estado_conservacao}
              onChange={(e) => setForm({ ...form, estado_conservacao: e.target.value })}
              placeholder="Pintura, pneus, mecânica, interior, avarias..."
            />
          </div>

          <div>
            <Label className="text-xs">Itens/opcionais (separados por vírgula)</Label>
            <Input
              value={form.itens_opcionais}
              onChange={(e) => setForm({ ...form, itens_opcionais: e.target.value })}
              placeholder="Bancos de couro, Teto solar, Central multimídia"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.tem_debito_multa_sinistro}
              onCheckedChange={(v) => setForm({ ...form, tem_debito_multa_sinistro: v })}
            />
            <Label className="text-sm">Tem débito, multa ou sinistro?</Label>
          </div>
          {form.tem_debito_multa_sinistro && (
            <Textarea
              placeholder="Descreva o débito/multa/sinistro"
              value={form.observacao_debito}
              onChange={(e) => setForm({ ...form, observacao_debito: e.target.value })}
            />
          )}

          <div>
            <Label className="text-xs">Fotos (opcional)</Label>
            <Input type="file" accept="image/*" multiple onChange={handleFotoUpload} disabled={enviandoFotos} />
            {enviandoFotos && <p className="text-xs text-gray-400 mt-1">Enviando fotos...</p>}
            {fotos.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {fotos.map((f) => (
                  <img key={f} src={f} alt="" className="w-16 h-16 object-cover rounded border" />
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">Observações gerais</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Salvar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
