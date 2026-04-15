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
  const [shareVehicle, setShareVehicle] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadVehicles = async () => {
    let query = supabase.from('veiculos').select('*')
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

    if (sortBy === 'recentes') query = query.order('created_at', { ascending: false })
    if (sortBy === 'antigos') query = query.order('created_at', { ascending: true })
    if (sortBy === 'menor_preco') query = query.order('preco_venda', { ascending: true })
    if (sortBy === 'maior_preco') query = query.order('preco_venda', { ascending: false })
    if (sortBy === 'menor_km') query = query.order('quilometragem', { ascending: true })

    const { data } = await query
    if (data) setVehicles(data)
  }

  useEffect(() => {
    loadVehicles()
  }, [debouncedSearch, sortBy, statusFilter])

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>
      case 'reservado':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Reservado</Badge>
      case 'vendido':
        return <Badge className="bg-slate-500 hover:bg-slate-600">Vendido</Badge>
      case 'consignado':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Consignado (Ativo)</Badge>
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
    const text = `🚗 ${shareVehicle.marca} ${shareVehicle.modelo} ${shareVehicle.ano_fabricacao}\n📍 ${shareVehicle.quilometragem} km | ${shareVehicle.cambio} | ${shareVehicle.combustivel}\n💰 ${formatCurrency(shareVehicle.preco_venda)}\n🏪 Carro e Cia Veículos - Uberaba/MG\n📱 (34) 99948-4285\n🔗 https://carroeciaveiculos.goskip.app/estoque/${shareVehicle.id}\n\n#CarrosCia #Uberaba #${shareVehicle.marca} #Consignação`
    return (
      <Dialog open={!!shareVehicle} onOpenChange={() => setShareVehicle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Anúncio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button className="flex-1 bg-[#1877F2] hover:bg-[#166FE5]">
                <Share2 className="w-4 h-4 mr-2" /> Facebook
              </Button>
              <Button className="flex-1 bg-[#E1306C] hover:bg-[#C13584]">
                <Share2 className="w-4 h-4 mr-2" /> Instagram
              </Button>
            </div>
            <div>
              <p className="font-bold text-sm mb-2 text-slate-700">Texto Sugerido</p>
              <Textarea readOnly value={text} className="h-40 text-xs font-mono bg-slate-50" />
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(text)
                toast({ title: 'Copiado' })
              }}
              className="w-full bg-slate-800 hover:bg-slate-900"
            >
              Copiar Texto
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
            <Car className="w-6 h-6 text-blue-600" /> Gestão de Estoque
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie seus veículos e a integração com portais.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="bg-white text-slate-700 hidden md:flex">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button variant="outline" className="bg-white text-slate-700 hidden md:flex">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
          <Button
            onClick={() => {
              setEditingId(null)
              setIsModalOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Veículo
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar placa, marca ou modelo..."
            className="pl-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Apenas Ativos</SelectItem>
                <SelectItem value="inativos">Inativos/Vendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Ordem:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais Recentes</SelectItem>
                <SelectItem value="antigos">Mais Antigos</SelectItem>
                <SelectItem value="menor_preco">Menor Preço</SelectItem>
                <SelectItem value="maior_preco">Maior Preço</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-16">FOTO</TableHead>
              <TableHead>VEÍCULO</TableHead>
              <TableHead>PLACA</TableHead>
              <TableHead>PREÇO SITE</TableHead>
              <TableHead>MATRIZ DE PORTAIS</TableHead>
              <TableHead className="text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <div className="w-16 h-12 bg-slate-100 rounded-md border overflow-hidden flex items-center justify-center">
                    {v.fotos?.[0] ? (
                      <img src={v.fotos[0]} className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800 leading-tight">
                      {v.marca} {v.modelo}
                    </p>
                    {getStatusBadge(v.status)}
                  </div>
                  <p className="text-xs text-slate-500 truncate max-w-[250px]">
                    {v.ano_fabricacao}/{v.ano_modelo} • {v.cor} •{' '}
                    {v.quilometragem?.toLocaleString('pt-BR')}km
                  </p>
                </TableCell>
                <TableCell className="font-mono text-sm text-slate-600 font-medium">
                  {v.placa || v.final_placa || '-'}
                </TableCell>
                <TableCell className="font-bold text-green-700">
                  {formatCurrency(v.preco_venda)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                    {v.publicado_webmotors && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 bg-red-50 text-red-700 border-red-200"
                      >
                        WM
                      </Badge>
                    )}
                    {v.publicado_icarros && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 bg-orange-50 text-orange-700 border-orange-200"
                      >
                        IC
                      </Badge>
                    )}
                    {v.publicado_olx && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200"
                      >
                        OLX
                      </Badge>
                    )}
                    {v.publicado_mercadolivre && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        ML
                      </Badge>
                    )}
                    {v.publicado_napista && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 bg-green-50 text-green-700 border-green-200"
                      >
                        NP
                      </Badge>
                    )}
                    {!v.publicado_webmotors &&
                      !v.publicado_icarros &&
                      !v.publicado_olx &&
                      !v.publicado_mercadolivre &&
                      !v.publicado_napista && (
                        <span className="text-[10px] text-slate-400">Apenas Site</span>
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
                      className="text-blue-600 hover:bg-blue-50"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="text-slate-500 hover:bg-slate-100"
                      title="Ver no site"
                    >
                      <a href={`/estoque/${v.id}`} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShareVehicle(v)}
                      className="text-pink-600 hover:bg-pink-50"
                      title="Compartilhar"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(v.id)}
                      className="text-red-600 hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {vehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  Nenhum veículo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
