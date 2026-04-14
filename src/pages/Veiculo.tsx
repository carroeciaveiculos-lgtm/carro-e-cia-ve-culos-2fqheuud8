import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  ChevronLeft,
  Calendar,
  Gauge,
  Cog,
  Fuel,
  DoorOpen,
  PaintBucket,
} from 'lucide-react'
import { VehicleCard } from '@/components/VehicleCard'

export default function Veiculo() {
  const { id } = useParams()
  const [vehicle, setVehicle] = useState<any>(null)
  const [similar, setSimilar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)

  // Simulation state
  const [simEntrada, setSimEntrada] = useState('')
  const [simParcelas, setSimParcelas] = useState('48')

  useEffect(() => {
    if (!id) return
    window.scrollTo(0, 0)
    const fetchVehicle = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('veiculos').select('*').eq('id', id).single()
      if (data) {
        setVehicle(data)
        const { data: simData } = await supabase
          .from('veiculos')
          .select('*')
          .eq('marca', data.marca)
          .neq('id', data.id)
          .limit(3)
        if (simData) setSimilar(simData)
      }
      setLoading(false)
    }
    fetchVehicle()
  }, [id])

  if (loading)
    return <div className="container py-20 text-center animate-pulse">Carregando veículo...</div>
  if (!vehicle) return <div className="container py-20 text-center">Veículo não encontrado.</div>

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const photos = vehicle.fotos || []

  const wppText = encodeURIComponent(
    `Olá! Vi o ${vehicle.marca} ${vehicle.modelo} ${vehicle.ano_fabricacao} por ${formatCurrency(vehicle.preco_venda || 0)} no site. Ainda está disponível?`,
  )

  const simValue = vehicle.preco_venda - (parseFloat(simEntrada) || 0)
  const simParcela = simValue > 0 ? (simValue * 1.5) / parseInt(simParcelas) : 0
  const wppSimText = encodeURIComponent(
    `Olá! Tenho interesse em simular o financiamento do ${vehicle.marca} ${vehicle.modelo} ${vehicle.ano_fabricacao} com R$ ${simEntrada} de entrada e ${simParcelas} parcelas. Podem me ajudar com as condições?`,
  )

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="container py-6">
        <Link
          to="/estoque"
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para o estoque
        </Link>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative group">
              <img
                src={photos[activePhoto] || 'https://img.usecurling.com/p/800/600?q=car'}
                alt={vehicle.modelo}
                className="w-full h-full object-cover"
              />
              {vehicle.is_consignado && (
                <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground border-none text-sm px-3 py-1">
                  Consignado
                </Badge>
              )}
              {!vehicle.is_consignado && (
                <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground border-none text-sm px-3 py-1">
                  Próprio
                </Badge>
              )}
            </div>

            {photos.length > 1 && (
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {photos.map((p: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`aspect-video rounded-md overflow-hidden border-2 transition-all ${activePhoto === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={p} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {vehicle.video_url && (
              <div className="mt-8 aspect-video rounded-xl overflow-hidden bg-black">
                <iframe src={vehicle.video_url} className="w-full h-full" allowFullScreen></iframe>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-2">
                {vehicle.marca} {vehicle.modelo}
              </h1>
              <p className="text-xl text-muted-foreground">{vehicle.versao}</p>
            </div>

            <div className="bg-card rounded-xl p-6 border shadow-sm mb-8">
              <div className="flex flex-col gap-1 mb-6">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Preço de Venda
                </span>
                <span className="text-4xl font-bold text-primary">
                  {formatCurrency(vehicle.preco_venda || 0)}
                </span>
                {vehicle.valor_fipe && (
                  <span className="text-sm text-muted-foreground mt-1">
                    Valor FIPE: {formatCurrency(vehicle.valor_fipe)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 gap-y-6 mb-8 py-6 border-y">
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ano</p>
                    <p className="font-bold">
                      {vehicle.ano_fabricacao}/{vehicle.ano_modelo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-lg">
                    <Gauge className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quilometragem</p>
                    <p className="font-bold">
                      {vehicle.quilometragem?.toLocaleString('pt-BR') || 0} km
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-lg">
                    <Cog className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Câmbio</p>
                    <p className="font-bold">{vehicle.cambio}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-lg">
                    <Fuel className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Combustível</p>
                    <p className="font-bold">{vehicle.combustivel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-lg">
                    <PaintBucket className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cor</p>
                    <p className="font-bold">{vehicle.cor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-lg">
                    <DoorOpen className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Portas</p>
                    <p className="font-bold">{vehicle.portas}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white h-14 text-lg"
                >
                  <a
                    href={`https://wa.me/5534999484285?text=${wppText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tenho Interesse
                  </a>
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-14 text-lg">
                      Simular Financiamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Simulação de Financiamento</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-bold mb-2 block">
                            Valor de Entrada (R$)
                          </label>
                          <Input
                            type="number"
                            placeholder="Ex: 20000"
                            value={simEntrada}
                            onChange={(e) => setSimEntrada(e.target.value)}
                            className="h-12"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold mb-2 block">Número de Parcelas</label>
                          <Select value={simParcelas} onValueChange={setSimParcelas}>
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12x</SelectItem>
                              <SelectItem value="24">24x</SelectItem>
                              <SelectItem value="36">36x</SelectItem>
                              <SelectItem value="48">48x</SelectItem>
                              <SelectItem value="60">60x</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {simValue > 0 && simEntrada && (
                        <div className="bg-muted p-4 rounded-xl text-center border">
                          <p className="text-sm text-muted-foreground mb-1">
                            Resultado estimado da parcela:
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {simParcelas}x de {formatCurrency(simParcela)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            * Valores sujeitos a análise de crédito.
                          </p>
                        </div>
                      )}

                      <Button
                        asChild
                        className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                      >
                        <a
                          href={`https://wa.me/5534999484285?text=${wppSimText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Simular com nosso consultor
                        </a>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-display font-bold mb-6">Diferenciais do Veículo</h3>
            {vehicle.diferenciais &&
            Array.isArray(vehicle.diferenciais) &&
            vehicle.diferenciais.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-y-3">
                {vehicle.diferenciais.map((dif: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>{dif}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum diferencial cadastrado.</p>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold mb-6">Descrição</h3>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {vehicle.descricao || 'Sem descrição detalhada.'}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-20 pt-10 border-t">
            <h3 className="text-2xl font-display font-bold mb-8">Veículos Similares</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
