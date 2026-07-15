import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Edit2,
  Plus,
  Search,
  Car,
  AlertTriangle,
  Eye,
  MessageCircle,
  CheckCircle,
  QrCode,
  Loader2,
  Undo2,
  Power,
  Share2,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import VehicleFormModal from './VehicleFormModal'
import { VehicleQuickViewModal } from '@/components/admin/VehicleQuickViewModal'
import { VehicleShareModal } from '@/components/admin/VehicleShareModal'
import { AIContentReview } from '@/components/admin/AIContentReview'
import { Sparkles } from 'lucide-react'

const STATUS_MAP: Record<string, string> = {
  ativos: 'disponivel',
  vendidos: 'vendido',
  devolvidos: 'devolvido',
}

export default function AdminEstoque() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeTab, setActiveTab] = useState('ativos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('recentes')
  const [diasFilter, setDiasFilter] = useState('todos')
  const [combustivelFilter, setCombustivelFilter] = useState('todos')
  const [elegibilidadeFilter, setElegibilidadeFilter] = useState('todos')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [shareVehicle, setShareVehicle] = useState<any>(null)
  const [quickViewVehicle, setQuickViewVehicle] = useState<any>(null)
  const [loadingQR, setLoadingQR] = useState(false)
  const [showAIReview, setShowAIReview] = useState(false)
  const { toast } = useToast()

  const combustiveis = ['Flex', 'Gasolina', 'Álcool', 'Diesel', 'Híbrido', 'Elétrico']
  const pageSize = 10

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadVehicles = async () => {
    try {
      let query = supabase.from('veiculos').select('*', { count: 'exact' })
      query = query.eq('status', STATUS_MAP[activeTab])
      if (debouncedSearch) {
        query = query.or(
          `marca.ilike.%${debouncedSearch}%,modelo.ilike.%${debouncedSearch}%,placa.ilike.%${debouncedSearch}%`,
        )
      }
      if (combustivelFilter !== 'todos') {
        query = query.eq('combustivel', combustivelFilter)
      }
      if (elegibilidadeFilter === 'elegivel') {
        query = query.eq('elegivel_portais', true)
      } else if (elegibilidadeFilter === 'inelegivel') {
        query = query.eq('elegivel_portais', false)
      }
      if (diasFilter !== 'todos' && activeTab === 'ativos') {
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - parseInt(diasFilter))
        query = query.lte('created_at', dateLimit.toISOString())
      }
      if (sortBy === 'recentes') query = query.order('created_at', { ascending: false })
      if (sortBy === 'antigos') query = query.order('created_at', { ascending: true })
      if (sortBy === 'menor_preco') query = query.order('preco_venda', { ascending: true })
      if (sortBy === 'maior_preco') query = query.order('preco_venda', { ascending: false })
      if (sortBy === 'marca_modelo')
        query = query.order('marca', { ascending: true }).order('modelo', { ascending: true })
      query = query.range(page * pageSize, (page + 1) * pageSize - 1)
      const { data, count, error } = await query
      if (error) throw error
      if (data) setVehicles(data)
      if (count !== null) setTotalCount(count)
    } catch {
      toast({ title: 'Erro ao carregar estoque', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [activeTab, debouncedSearch, sortBy, diasFilter, combustivelFilter, elegibilidadeFilter, page])

  const handleDevolver = async (id: string) => {
    if (!confirm('Tem certeza que deseja devolver este veículo ao cliente?')) return
    const { error } = await supabase.from('veiculos').update({ status: 'devolvido' }).eq('id', id)
    if (error) toast({ title: 'Erro ao devolver', variant: 'destructive' })
    else {
      toast({ title: 'Veículo devolvido ao cliente' })
      loadVehicles()
    }
  }

  const handleSell = async (id: string) => {
    if (!confirm('Confirmar venda deste veículo? Ele sairá da vitrine pública.')) return
    const { error } = await supabase.from('veiculos').update({ status: 'vendido' }).eq('id', id)
    if (error) toast({ title: 'Erro ao registrar venda', variant: 'destructive' })
    else {
      toast({ title: 'Venda registrada com sucesso! 🎉' })
      loadVehicles()
    }
  }

  const handleAtivar = async (id: string) => {
    const { error } = await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', id)
    if (error) toast({ title: 'Erro ao ativar veículo', variant: 'destructive' })
    else {
      toast({ title: 'Veículo ativado com sucesso!' })
      loadVehicles()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este veículo?')) return
    try {
      await supabase.from('estoque_publicacoes').delete().eq('veiculo_id', id)
      await supabase.from('social_posts').delete().eq('veiculo_id', id)
      await supabase.from('ml_listings').delete().eq('veiculo_id', id)
      await supabase.from('documentos').delete().eq('veiculo_id', id)
      await supabase.from('despesas').delete().eq('veiculo_id', id)
      await supabase.from('simulacoes').delete().eq('veiculo_id', id)
      await supabase.from('contratos_consignacao').delete().eq('veiculo_id', id)
      await supabase.from('consignacoes').delete().eq('veiculo_id', id)
      await supabase.from('logs_integracao').delete().eq('veiculo_id', id)
      await supabase.from('leads').update({ veiculo_id: null }).eq('veiculo_id', id)
      await supabase.from('notas_fiscais').update({ veiculo_id: null }).eq('veiculo_id', id)

      const { error } = await supabase.from('veiculos').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Veículo excluído com sucesso!' })
      loadVehicles()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  const generateMissingQRCodes = async () => {
    setLoadingQR(true)
    try {
      const { data: veiculos } = await supabase
        .from('veiculos')
        .select('id, marca, modelo')
        .is('qrcode_url', null)
      if (!veiculos || veiculos.length === 0) {
        toast({ title: 'Todos os veículos já possuem QR Code.' })
        setLoadingQR(false)
        return
      }
      toast({ title: `Gerando ${veiculos.length} QR Codes...` })
      for (const v of veiculos) {
        const siteUrl = import.meta.env.VITE_SITE_URL || 'https://www.carroeciamotors.com.br'
        const url = `${siteUrl}/estoque/${v.id}`
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
        try {
          const res = await fetch(qrUrl)
          const blob = await res.blob()
          const fileName = `${v.id}_qrcode.png`
          const { error: uploadError } = await supabase.storage
            .from('logos-e-imagens')
            .upload(`qrcodes/${fileName}`, blob, { contentType: 'image/png', upsert: true })
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('logos-e-imagens')
              .getPublicUrl(`qrcodes/${fileName}`)
            await supabase
              .from('veiculos')
              .update({ qrcode_url: publicUrlData.publicUrl })
              .eq('id', v.id)
          }
        } catch {
          /* ignore */
        }
      }
      toast({ title: 'QR Codes gerados com sucesso!' })
      loadVehicles()
    } catch (e: any) {
      toast({ title: 'Erro ao gerar QR Codes', description: e.message, variant: 'destructive' })
    } finally {
      setLoadingQR(false)
    }
  }

  const formatCurrency = (val: number) =>
    val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '-'

  const diasEmEstoque = (dateString: string) => {
    if (!dateString) return 0
    return Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-green-600">Ativo</Badge>
      case 'vendido':
        return <Badge className="bg-slate-500">Vendido</Badge>
      case 'devolvido':
        return <Badge className="bg-amber-500">Devolvido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" /> Estoque e Integrador
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie seus veículos ativos, vendidos e devolvidos.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'ativos' && (
            <Button
              variant="outline"
              onClick={generateMissingQRCodes}
              disabled={loadingQR}
              className="hidden sm:flex border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <QrCode className="w-4 h-4 mr-2" /> {loadingQR ? 'Gerando...' : 'Gerar QR Codes'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowAIReview(true)}
            className="hidden sm:flex border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Revisão IA
          </Button>
          <Button
            onClick={() => {
              setEditingId(null)
              setIsModalOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Veículo
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar placa, marca ou modelo..."
            className="pl-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Select value={combustivelFilter} onValueChange={setCombustivelFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Combustível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {combustiveis.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeTab === 'ativos' && (
            <Select value={diasFilter} onValueChange={setDiasFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tempo Estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="30">+ de 30 dias</SelectItem>
                <SelectItem value="60">+ de 60 dias</SelectItem>
                <SelectItem value="90">+ de 90 dias</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ordem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentes">Mais Recentes</SelectItem>
              <SelectItem value="antigos">Mais Antigos</SelectItem>
              <SelectItem value="menor_preco">Menor Preço</SelectItem>
              <SelectItem value="maior_preco">Maior Preço</SelectItem>
              <SelectItem value="marca_modelo">Marca + Modelo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={elegibilidadeFilter} onValueChange={setElegibilidadeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Elegibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="elegivel">Elegíveis</SelectItem>
              <SelectItem value="inelegivel">Inelegíveis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v)
          setPage(0)
        }}
      >
        <TabsList className="bg-white border rounded-t-xl w-full justify-start px-4 gap-2">
          <TabsTrigger value="ativos">Ativos</TabsTrigger>
          <TabsTrigger value="vendidos">Vendidos</TabsTrigger>
          <TabsTrigger value="devolvidos">Devolvidos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-16">FOTO</TableHead>
              <TableHead>VEÍCULO</TableHead>
              <TableHead>DADOS</TableHead>
              <TableHead>MÉTRICAS</TableHead>
              <TableHead>PORTAIS</TableHead>
              <TableHead className="text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => {
              const dias = diasEmEstoque(v.created_at)
              const isEncalhado = dias > 60 && v.status === 'disponivel'
              const poucaVisibilidade = v.visualizacoes_site < 50 && dias > 30
              return (
                <TableRow key={v.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="w-16 h-12 bg-slate-100 rounded-md border overflow-hidden">
                      {v.fotos?.[0] ? (
                        <img src={v.fotos[0]} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-6 h-6 m-auto mt-3 text-slate-300" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-800">
                        {v.marca} {v.modelo}
                      </p>
                      {getStatusBadge(v.status)}
                      {v.is_consignado && (
                        <Badge className="bg-purple-600 text-[9px]">Consig.</Badge>
                      )}
                      {(v as any).em_preparacao && (
                        <Badge className="bg-amber-500 text-[9px]">Prep.</Badge>
                      )}{' '}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {v.placa || 'SEM PLACA'} • {v.ano_fabricacao} • {v.cor}
                    </div>
                    {activeTab === 'ativos' && (isEncalhado || poucaVisibilidade) && (
                      <div className="mt-1 flex flex-col gap-1">
                        {isEncalhado && (
                          <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center w-fit">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Encalhado ({dias} dias)
                          </span>
                        )}
                        {poucaVisibilidade && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center w-fit">
                            <Eye className="w-3 h-3 mr-1" /> Poucas Visualizações
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-green-700">{formatCurrency(v.preco_venda)}</p>
                    <p className="text-[10px] text-slate-400">
                      Dias: <span className="font-bold text-slate-600">{dias}</span>
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1" title="Visualizações no Site">
                        <Eye className="w-3 h-3" /> {v.visualizacoes_site || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Cliques no WhatsApp">
                        <MessageCircle className="w-3 h-3" /> {v.cliques_whatsapp || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {v.publicado_webmotors && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 bg-red-50 text-red-700"
                        >
                          WM
                        </Badge>
                      )}
                      {v.publicado_icarros && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 bg-orange-50 text-orange-700"
                        >
                          IC
                        </Badge>
                      )}
                      {v.publicado_mercadolivre && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 bg-yellow-50 text-yellow-700"
                        >
                          ML
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuickViewVehicle(v)}
                        className="text-slate-600"
                        title="Consultar/Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(v.id)
                          setIsModalOpen(true)
                        }}
                        className="text-blue-600"
                        title="Editar Veículo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {activeTab === 'ativos' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShareVehicle(v)}
                            className="text-pink-600"
                            title="Compartilhar"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSell(v.id)}
                            className="text-green-600 hover:bg-green-50"
                            title="Marcar como Vendido"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDevolver(v.id)}
                            className="text-amber-600 hover:bg-amber-50"
                            title="Devolver ao Cliente"
                          >
                            <Undo2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {activeTab === 'devolvidos' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAtivar(v.id)}
                          className="text-green-600 hover:bg-green-50"
                          title="Ativar Veículo"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(v.id)}
                        className="text-red-600 hover:bg-red-50"
                        title="Excluir Veículo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {vehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  Nenhum veículo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalCount > pageSize && (
          <div className="p-4 border-t flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalCount)} de{' '}
              {totalCount} veículos
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * pageSize >= totalCount}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <VehicleShareModal
        vehicle={shareVehicle}
        open={!!shareVehicle}
        onOpenChange={(open) => {
          if (!open) setShareVehicle(null)
        }}
      />
      <VehicleQuickViewModal
        vehicle={quickViewVehicle}
        open={!!quickViewVehicle}
        onOpenChange={(open) => {
          if (!open) setQuickViewVehicle(null)
        }}
      />
      {isModalOpen && (
        <VehicleFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          vehicleId={editingId}
          onSuccess={loadVehicles}
        />
      )}
      <AIContentReview open={showAIReview} onOpenChange={setShowAIReview} />
    </div>
  )
}
