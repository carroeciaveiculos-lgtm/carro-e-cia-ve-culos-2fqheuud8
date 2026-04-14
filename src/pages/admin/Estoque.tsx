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
import { Edit2, ExternalLink, Trash2, Share2, Plus, Printer, Download, Search } from 'lucide-react'
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
  }, [debouncedSearch, sortBy])

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
        return <Badge className="bg-[#2E7D32] hover:bg-[#2E7D32]">Disponível</Badge>
      case 'reservado':
        return <Badge className="bg-[#FBC02D] hover:bg-[#FBC02D] text-black">Reservado</Badge>
      case 'vendido':
        return <Badge className="bg-[#C62828] hover:bg-[#C62828]">Vendido</Badge>
      case 'consignado':
        return <Badge className="bg-[#1565C0] hover:bg-[#1565C0]">Consignado</Badge>
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
            <DialogTitle>Compartilhar Veículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button className="w-full bg-[#1877F2] hover:bg-[#166FE5]">
              Continuar com o Facebook
            </Button>
            <div className="text-xs text-center text-gray-500 border-b pb-4">
              Aviso: Instagram permite 25 posts/dia.
              <br />
              Fan Page: Carro e Cia Veículos | ID: 1419304271478565
            </div>
            <div>
              <p className="font-bold text-sm mb-2">Texto de Compartilhamento Manual</p>
              <Textarea readOnly value={text} className="h-40 text-xs font-mono bg-gray-50" />
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(text)
                toast({ title: 'Copiado' })
              }}
              className="w-full bg-[#2E7D32] hover:bg-[#1B5E20]"
            >
              Copiar Texto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">ESTOQUE DE VEÍCULOS</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="bg-white text-gray-700">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button variant="outline" className="bg-white text-gray-700">
            <Download className="w-4 h-4 mr-2" /> Exportar p/ Excel
          </Button>
          <Button
            onClick={() => {
              setEditingId(null)
              setIsModalOpen(true)
            }}
            className="bg-[#1976D2] hover:bg-[#1565C0] text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Veículo
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative max-w-md w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por placa, marca ou modelo..."
            className="pl-9 bg-gray-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Ordenar por:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentes">Mais Recentes</SelectItem>
              <SelectItem value="antigos">Mais Antigos</SelectItem>
              <SelectItem value="menor_preco">Menor Preço</SelectItem>
              <SelectItem value="maior_preco">Maior Preço</SelectItem>
              <SelectItem value="menor_km">Menor KM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>FOTO</TableHead>
              <TableHead>VEÍCULO</TableHead>
              <TableHead>ANO</TableHead>
              <TableHead>PLACA</TableHead>
              <TableHead>COR</TableHead>
              <TableHead>KM</TableHead>
              <TableHead>COMBUSTÍVEL</TableHead>
              <TableHead>ÚNICO DONO</TableHead>
              <TableHead>PREÇO SITE</TableHead>
              <TableHead>PREÇO CLASSIF.</TableHead>
              <TableHead className="text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="w-14 h-10 bg-gray-200 rounded overflow-hidden">
                    {v.fotos?.[0] && (
                      <img src={v.fotos[0]} className="w-full h-full object-cover" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-bold text-[#1565C0] leading-tight">
                    {v.marca} {v.modelo}
                  </p>
                  <p className="text-xs text-gray-500 mb-1 truncate max-w-[120px]">
                    {v.versao || '-'}
                  </p>
                  {getStatusBadge(v.status)}
                </TableCell>
                <TableCell>
                  {v.ano_fabricacao}/{v.ano_modelo}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {v.placa || v.final_placa || '-'}
                </TableCell>
                <TableCell>{v.cor || '-'}</TableCell>
                <TableCell>{v.quilometragem?.toLocaleString('pt-BR') || 0} km</TableCell>
                <TableCell>{v.combustivel || '-'}</TableCell>
                <TableCell>
                  {(v.caracteristicas || []).includes('Único Dono') ? 'Sim' : 'Não'}
                </TableCell>
                <TableCell className="font-medium text-[#2E7D32]">
                  {formatCurrency(v.preco_venda)}
                </TableCell>
                <TableCell className="font-medium text-gray-600">
                  {formatCurrency(v.preco_classificados)}
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
                      className="text-[#1976D2] hover:bg-[#1976D2]/10"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="hover:bg-gray-100"
                      title="Visualizar"
                    >
                      <a href={`/estoque/${v.id}`} target="_blank">
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShareVehicle(v)}
                      className="text-[#E65100] hover:bg-[#E65100]/10"
                      title="Compartilhar"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(v.id)}
                      className="text-[#C62828] hover:bg-[#C62828]/10"
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
                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
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
