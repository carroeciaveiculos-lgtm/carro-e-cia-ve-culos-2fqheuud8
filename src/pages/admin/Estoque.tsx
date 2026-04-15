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
import {
  Edit2,
  ExternalLink,
  Trash2,
  Share2,
  Plus,
  Printer,
  Download,
  Search,
  Car,
  AlertTriangle,
  Eye,
  MessageCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import VehicleFormModal from './VehicleFormModal'

export default function AdminEstoque() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('recentes')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [diasFilter, setDiasFilter] = useState('todos')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10
  const [shareVehicle, setShareVehicle] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadVehicles = async () => {
    try {
      let query = supabase.from('veiculos').select('*', { count: 'exact' })
      if (debouncedSearch) {
        query = query.or(
          `marca.ilike.%${debouncedSearch}%,modelo.ilike.%${debouncedSearch}%,placa.ilike.%${debouncedSearch}%`,
        )
      }
      if (statusFilter !== 'todos') {
        if (statusFilter === 'ativos') query = query.in('status', ['disponivel', 'consignado'])
        if (statusFilter === 'inativos')
          query = query.in('status', ['vendido', 'reservado', 'inativo'])
      }
      if (diasFilter !== 'todos') {
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - parseInt(diasFilter))
        query = query.lte('created_at', dateLimit.toISOString())
      }

      if (sortBy === 'recentes') query = query.order('created_at', { ascending: false })
      if (sortBy === 'antigos') query = query.order('created_at', { ascending: true })
      if (sortBy === 'menor_preco') query = query.order('preco_venda', { ascending: true })
      if (sortBy === 'maior_preco') query = query.order('preco_venda', { ascending: false })

      query = query.range(page * pageSize, (page + 1) * pageSize - 1)

      const { data, count, error } = await query
      if (error) throw error
      if (data) setVehicles(data)
      if (count !== null) setTotalCount(count)
    } catch (error) {
      toast({ title: 'Erro ao carregar estoque', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [debouncedSearch, sortBy, statusFilter, diasFilter, page])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return
    const { error } = await supabase.from('veiculos').delete().eq('id', id)
    if (error) toast({ title: 'Erro ao excluir', variant: 'destructive' })
    else {
      toast({ title: 'Veículo excluído' })
      loadVehicles()
    }
  }

  const formatCurrency = (val: number) =>
    val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '-'

  const diasEmEstoque = (dateString: string) => {
    if (!dateString) return 0
    const diff = new Date().getTime() - new Date(dateString).getTime()
    return Math.floor(diff / (1000 * 3600 * 24))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-green-600">Ativo</Badge>
      case 'reservado':
        return <Badge className="bg-amber-500">Reservado</Badge>
      case 'vendido':
        return <Badge className="bg-slate-500">Vendido</Badge>
      case 'inativo':
        return (
          <Badge variant="outline" className="text-slate-400">
            Inativo
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        )
    }
  }

  const ShareModal = () => {
    if (!shareVehicle) return null
    const text = `🚗 ${shareVehicle.marca} ${shareVehicle.modelo}\n💰 ${formatCurrency(shareVehicle.preco_venda)}\n🔗 https://carroeciaveiculos.goskip.app/estoque/${shareVehicle.id}`
    return (
      <Dialog open={!!shareVehicle} onOpenChange={() => setShareVehicle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Anúncio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea readOnly value={text} className="h-24 bg-slate-50 text-xs font-mono" />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(text)
                toast({ title: 'Copiado' })
              }}
              className="w-full"
            >
              Copiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" /> Estoque e Integrador
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie seus veículos e a integração com portais.
          </p>
        </div>
        <div className="flex gap-2">
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ordem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentes">Mais Recentes</SelectItem>
              <SelectItem value="antigos">Mais Antigos</SelectItem>
              <SelectItem value="menor_preco">Menor Preço</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {v.placa || 'SEM PLACA'} • {v.ano_fabricacao} • {v.cor}
                    </div>
                    {(isEncalhado || poucaVisibilidade) && (
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
                        onClick={() => {
                          setEditingId(v.id)
                          setIsModalOpen(true)
                        }}
                        className="text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShareVehicle(v)}
                        className="text-pink-600"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(v.id)}
                        className="text-red-600"
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

        {/* Paginação */}
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
      <ShareModal />
      {isModalOpen && (
        <VehicleFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          vehicleId={editingId}
          onSuccess={loadVehicles}
        />
      )}
    </div>
  )
}
