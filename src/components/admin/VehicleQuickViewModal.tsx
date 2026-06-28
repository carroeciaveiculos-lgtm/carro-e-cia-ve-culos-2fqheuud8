import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Car,
  Phone,
  Mail,
  User,
  Calendar,
  Gauge,
  Cog,
  Fuel,
  PaintBucket,
  DoorOpen,
  Eye,
  MessageCircle,
} from 'lucide-react'

function SpecItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

export function VehicleQuickViewModal({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: any
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!vehicle) return null

  const formatCurrency = (val: number) =>
    val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '-'

  const photos: string[] = Array.isArray(vehicle.fotos) ? vehicle.fotos : []

  const statusBadge = (status: string) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            {vehicle.marca} {vehicle.modelo} {vehicle.versao}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.slice(0, 8).map((photo: string, i: number) => (
                  <div key={i} className="aspect-video rounded-md overflow-hidden bg-slate-100">
                    {photo.match(/\.(mp4|mov)$/i) ? (
                      <video src={photo} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={photo} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {statusBadge(vehicle.status)}
              {vehicle.is_consignado && <Badge className="bg-purple-600">Consignado</Badge>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <SpecItem
                icon={Calendar}
                label="Ano"
                value={`${vehicle.ano_fabricacao}/${vehicle.ano_modelo || ''}`}
              />
              <SpecItem
                icon={Gauge}
                label="KM"
                value={vehicle.quilometragem?.toLocaleString('pt-BR') || '-'}
              />
              <SpecItem icon={Cog} label="Câmbio" value={vehicle.cambio || '-'} />
              <SpecItem icon={Fuel} label="Combustível" value={vehicle.combustivel || '-'} />
              <SpecItem icon={PaintBucket} label="Cor" value={vehicle.cor || '-'} />
              <SpecItem icon={DoorOpen} label="Portas" value={vehicle.portas?.toString() || '-'} />
            </div>

            <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Preço de Venda</p>
                <p className="font-bold text-green-700">{formatCurrency(vehicle.preco_venda)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Preço Mínimo</p>
                <p className="font-bold">{formatCurrency(vehicle.preco_minimo)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Valor FIPE</p>
                <p className="font-bold">{formatCurrency(vehicle.valor_fipe)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3">Proprietário</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{vehicle.proprietario_nome || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{vehicle.proprietario_telefone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{vehicle.proprietario_email || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">CPF:</span>
                  <span>{vehicle.proprietario_cpf || '-'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <span>{vehicle.visualizacoes_site || 0} visualizações</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-slate-400" />
                <span>{vehicle.cliques_whatsapp || 0} cliques WhatsApp</span>
              </div>
            </div>

            {Array.isArray(vehicle.caracteristicas) && vehicle.caracteristicas.length > 0 && (
              <div>
                <h3 className="font-bold mb-2">Características</h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.caracteristicas.map((c: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(vehicle.diferenciais) && vehicle.diferenciais.length > 0 && (
              <div>
                <h3 className="font-bold mb-2">Opcionais</h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.diferenciais.map((d: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {vehicle.descricao && (
              <div>
                <h3 className="font-bold mb-2">Descrição</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{vehicle.descricao}</p>
              </div>
            )}

            <div className="text-xs text-slate-400 font-mono">
              Placa: {vehicle.placa || 'SEM PLACA'} • Chassi: {vehicle.chassi || '-'} • Renavam:{' '}
              {vehicle.renavam || '-'}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
