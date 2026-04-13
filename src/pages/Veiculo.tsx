import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { mockVehicles } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LeadForm } from '@/components/LeadForm'
import {
  CheckCircle2,
  ChevronRight,
  Fuel,
  Gauge,
  Palette,
  Settings,
  CalendarDays,
} from 'lucide-react'

const Veiculo = () => {
  const { id } = useParams()
  const [vehicle, setVehicle] = useState(mockVehicles[0])
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    const found = mockVehicles.find((v) => v.id === id)
    if (found) setVehicle(found)
    window.scrollTo(0, 0)
  }, [id])

  if (!vehicle) return <div>Carregando...</div>

  const whatsappMessage = `Olá, tenho interesse no veículo ${vehicle.brand} ${vehicle.model} ${vehicle.version} anunciado no site por R$ ${vehicle.price.toLocaleString('pt-BR')}.`

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="container">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">
            Início
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/estoque" className="hover:text-primary">
            Estoque
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">
            {vehicle.brand} {vehicle.model}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted border">
              <img
                src={vehicle.images[activeImage] || vehicle.images[0]}
                alt="Veículo"
                className="w-full h-full object-cover"
              />
            </div>
            {vehicle.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'}`}
                    onClick={() => setActiveImage(idx)}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {vehicle.type === 'consignado' ? 'Consignação' : 'Estoque Próprio'}
                </span>
                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Final da Placa: {vehicle.plateEnd}
                </span>
              </div>
              <h1 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mt-4 mb-2">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-xl text-muted-foreground">{vehicle.version}</p>
            </div>

            <div className="text-4xl font-display font-bold text-foreground mb-8 pb-8 border-b">
              R$ {vehicle.price.toLocaleString('pt-BR')}
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8 pb-8 border-b">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4" /> Ano
                </span>
                <span className="font-semibold">{vehicle.year}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Gauge className="w-4 h-4" /> Quilometragem
                </span>
                <span className="font-semibold">{vehicle.km.toLocaleString('pt-BR')} km</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4" /> Câmbio
                </span>
                <span className="font-semibold">{vehicle.transmission}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Fuel className="w-4 h-4" /> Combustível
                </span>
                <span className="font-semibold">{vehicle.fuel}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Palette className="w-4 h-4" /> Cor
                </span>
                <span className="font-semibold">{vehicle.color}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Portas
                </span>
                <span className="font-semibold">{vehicle.doors}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700 h-14 text-lg"
                onClick={() =>
                  window.open(
                    `https://wa.me/5534999999999?text=${encodeURIComponent(whatsappMessage)}`,
                    '_blank',
                  )
                }
              >
                Tenho Interesse
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="flex-1 h-14 text-lg">
                    Simular Financiamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Simular Financiamento</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <LeadForm
                      title="Dados para simulação"
                      subtitle={`Veículo: ${vehicle.brand} ${vehicle.model}`}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Veiculo
