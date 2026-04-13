import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
import { getVeiculoById, Veiculo as VeiculoType } from '@/services/veiculos'
import { Skeleton } from '@/components/ui/skeleton'

const Veiculo = () => {
  const { id } = useParams()
  const [vehicle, setVehicle] = useState<VeiculoType | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getVeiculoById(id).then(({ data }) => {
        setVehicle(data)
        setLoading(false)
        window.scrollTo(0, 0)
      })
    }
  }, [id])

  if (loading)
    return (
      <div className="container pt-32 pb-20">
        <Skeleton className="w-full h-[600px] rounded-xl" />
      </div>
    )
  if (!vehicle)
    return (
      <div className="container pt-32 pb-20 text-center font-display font-bold text-2xl">
        Veículo não encontrado.
      </div>
    )

  const images = (vehicle.fotos as string[]) || ['https://img.usecurling.com/p/800/600?q=car']
  const price = vehicle.preco_venda || 0
  const phoneNumber = import.meta.env.VITE_WHATSAPP_PHONE || '5534999484285'
  const whatsappMessage = `Olá! Tenho interesse no veículo ${vehicle.marca} ${vehicle.modelo} ${vehicle.versao} anunciado no site por R$ ${price.toLocaleString('pt-BR')}. Ainda está disponível?`

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="container">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-primary">
            Início
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link to="/estoque" className="hover:text-primary">
            Estoque
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-foreground font-medium">
            {vehicle.marca} {vehicle.modelo}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted border">
              <img src={images[activeImage]} alt="Veículo" className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
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

          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {vehicle.is_consignado ? 'Consignação' : 'Estoque Próprio'}
                </span>
                {vehicle.final_placa && (
                  <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Final da Placa: {vehicle.final_placa}
                  </span>
                )}
              </div>
              <h1 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mt-4 mb-2">
                {vehicle.marca} {vehicle.modelo}
              </h1>
              <p className="text-xl text-muted-foreground">{vehicle.versao}</p>
            </div>

            <div className="text-4xl font-display font-bold text-foreground mb-8 pb-8 border-b">
              R$ {price.toLocaleString('pt-BR')}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8 pb-8 border-b">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4" /> Ano
                </span>
                <span className="font-semibold">
                  {vehicle.ano_fabricacao}/{vehicle.ano_modelo}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Gauge className="w-4 h-4" /> Quilometragem
                </span>
                <span className="font-semibold">
                  {(vehicle.quilometragem || 0).toLocaleString('pt-BR')} km
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4" /> Câmbio
                </span>
                <span className="font-semibold">{vehicle.cambio || 'Não informado'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Fuel className="w-4 h-4" /> Combustível
                </span>
                <span className="font-semibold">{vehicle.combustivel || 'Não informado'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Palette className="w-4 h-4" /> Cor
                </span>
                <span className="font-semibold">{vehicle.cor || 'Não informada'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Portas
                </span>
                <span className="font-semibold">{vehicle.portas || 4}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                size="lg"
                className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white h-14 text-lg"
                onClick={() =>
                  window.open(
                    `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`,
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
                      subtitle={`Veículo: ${vehicle.marca} ${vehicle.modelo}`}
                      origem="Site - Financiamento"
                      veiculoInteresse={`${vehicle.marca} ${vehicle.modelo}`}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-accent/10 p-6 rounded-xl border border-accent/20 text-center">
              <h4 className="font-bold text-lg mb-2">Financie com facilidade</h4>
              <p className="text-sm text-muted-foreground mb-4">
                A Km Zero Corretora tem as melhores taxas do mercado para você.
              </p>
              <Button
                asChild
                variant="secondary"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <a href="https://www.kmzero.com.br" target="_blank" rel="noopener noreferrer">
                  Visitar parceiro oficial
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Veiculo
