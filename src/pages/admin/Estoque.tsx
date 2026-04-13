import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { mockVehicles } from '@/lib/mock-data'

const AdminEstoque = () => {
  const [search, setSearch] = useState('')

  const filtered = mockVehicles.filter(
    (v) =>
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciar Estoque</h2>
          <p className="text-muted-foreground">Adicione, edite ou remova veículos do site.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Adicionar Veículo
        </Button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar placa, modelo ou marca..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={vehicle.images[0]}
                      alt=""
                      className="w-12 h-12 rounded object-cover border"
                    />
                    <div>
                      <div className="font-medium">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                        {vehicle.version}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell className="font-medium">
                  R$ {vehicle.price.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Badge variant={vehicle.type === 'consignado' ? 'secondary' : 'outline'}>
                    {vehicle.type === 'consignado' ? 'Consignado' : 'Próprio'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Pencil className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive focus:text-destructive-foreground">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default AdminEstoque
