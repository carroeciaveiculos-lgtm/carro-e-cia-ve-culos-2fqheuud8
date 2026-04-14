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
import { Plus, Edit2, ExternalLink, Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import VehicleFormModal from './VehicleFormModal'

export default function AdminEstoque() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadVehicles = async () => {
    let query = supabase.from('veiculos').select('*').order('created_at', { ascending: false })
    if (search) {
      query = query.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%`)
    }
    const { data } = await query
    if (data) setVehicles(data)
  }

  useEffect(() => {
    loadVehicles()
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return
    const { error } = await supabase.from('veiculos').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir veículo', variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Veículo excluído' })
      loadVehicles()
    }
  }

  const openEdit = (id: string) => {
    setEditingId(id)
    setIsModalOpen(true)
  }

  const openNew = () => {
    setEditingId(null)
    setIsModalOpen(true)
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-display font-bold">Gerenciar Estoque</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Veículo
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por marca ou modelo..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum veículo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                        {v.fotos && v.fotos[0] ? (
                          <img src={v.fotos[0]} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-bold">
                          {v.marca} {v.modelo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.is_consignado ? 'Consignado' : 'Próprio'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{v.ano_fabricacao}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(v.preco_venda || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={v.status === 'disponivel' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEdit(v.id)}
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" asChild title="Ver no site">
                        <a href={`/estoque/${v.id}`} target="_blank">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive hover:text-white"
                        onClick={() => handleDelete(v.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
