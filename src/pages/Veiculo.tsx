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
  Phone,
  MessageCircle,
  Share2,
} from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { VehicleCard } from '@/components/VehicleCard'
import { Skeleton } from '@/components/ui/skeleton'
import {
  trackVehicleView,
  trackWhatsAppClick,
  trackSimulation,
  trackCTAClick,
} from '@/lib/tracking'
import { getSocialImageUrl } from '@/lib/image-utils'
import { SEO } from '@/components/SEO'

export default function Veiculo() {
  const { id } = useParams()
  const [vehicle, setVehicle] = useState<any>(null)
  const [similar, setSimilar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!api) return

    api.on('select', () => {
      setActivePhoto(api.selectedScrollSnap())
    })
  }, [api])

  useEffect(() => {
    if (api && activePhoto !== api.selectedScrollSnap()) {
      api.scrollTo(activePhoto)
    }
  }, [activePhoto, api])

  // Simulation state
  const [simEntrada, setSimEntrada] = useState('')
  const [simParcelas, setSimParcelas] = useState('48')

  useEffect(() => {
    if (!id) return
    window.scrollTo(0, 0)
    const fetchVehicle = async () => {
      setLoading(true)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id || '',
      )
      let query = supabase.from('veiculos').select('*')
      if (isUUID) {
        query = query.eq('id', id)
      } else {
        query = query.eq('slug', id)
      }
      const { data, error } = await query.single()
      if (data && data.status === 'disponivel' && data.exibir_no_site !== false) {
        setVehicle(data)
        const { data: simData } = await supabase
          .from('veiculos')
          .select('*')
          .eq('marca', data.marca)
          .eq('status', 'disponivel')
          .neq('id', data.id)
          .limit(3)
        if (simData) setSimilar(simData)
      }
      setLoading(false)
    }
    fetchVehicle()
  }, [id])

  useEffect(() => {
    if (vehicle) {
      trackVehicleView(
        `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano_fabricacao}`,
        vehicle.preco_venda,
        vehicle.categoria || 'Carro',
        vehicle.id,
      )
    }
  }, [vehicle])

  if (loading) {
    return (
      <div className="bg-background min-h-screen pb-20">
        <div className="container py-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
            <div className="space-y-4">
              <Skeleton className="aspect-[4/3] rounded-xl w-full" />
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-video rounded-md" />
                ))}
              </div>
            </div>
            <div className="flex flex-col space-y-6">
              <div>
                <Skeleton className="h-10 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2" />
              </div>
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!vehicle) return <div className="container py-20 text-center">Veículo não encontrado.</div>

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const photos = vehicle.fotos || []

  const vehicleUrl = vehicle.slug
    ? `https://www.carroeciamotors.com.br/estoque/${vehicle.slug}`
    : `https://www.carroeciamotors.com.br/estoque/${vehicle.id}`

  const wppText = `*Oportunidade Imperdível!*\n\n🚗 *${vehicle.marca} ${vehicle.modelo} ${vehicle.versao || ''}*\n📅 Ano: ${vehicle.ano_fabricacao}/${vehicle.ano_modelo}\n🛣️ ${vehicle.quilometragem ? `${vehicle.quilometragem.toLocaleString('pt-BR')} km` : 'Excelente km'}\n💰 *${formatCurrency(vehicle.preco_venda || 0)}*\n\nVenda ou Compre seu carro rápido e seguro.\n\n${vehicleUrl}`

  const simValue = vehicle.preco_venda - (parseFloat(simEntrada) || 0)
  const simParcela = simValue > 0 ? (simValue * 1.5) / parseInt(simParcelas) : 0
  const wppSimText = `*Oportunidade Imperdível!*\n\nOlá! Tenho interesse em simular o financiamento do ${vehicle.marca} ${vehicle.modelo} ${vehicle.ano_fabricacao}.\n\n💰 Valor: ${formatCurrency(vehicle.preco_venda || 0)}\n💵 Entrada: R$ ${simEntrada || '0'}\n📅 Parcelas: ${simParcelas}x\n\nVenda ou Compre seu carro rápido e seguro.\n\n${vehicleUrl}`

  const handleSimulationWhatsApp = async () => {
    const entryPercent = vehicle.preco_venda
      ? ((parseFloat(simEntrada) || 0) / vehicle.preco_venda) * 100
      : 0

    await supabase.from('simulacoes').insert({
      veiculo_id: vehicle.id,
      valor_carro: vehicle.preco_venda,
      entrada_percentual: entryPercent,
      prazo_meses: parseInt(simParcelas),
      status: 'Pendente',
    })

    trackSimulation(vehicle.preco_venda, entryPercent, simParcelas)
    trackWhatsAppClick('Luiz', 'simulacao_financiamento')
  }

  const getShareText = () => {
    const price = formatCurrency(vehicle.preco_venda || 0)
    const km = vehicle.quilometragem
      ? `${vehicle.quilometragem.toLocaleString('pt-BR')} km`
      : 'Excelente km'

    return `*Oportunidade Imperdível!*\n\n🚗 *${vehicle.marca} ${vehicle.modelo} ${vehicle.versao || ''}*\n📅 Ano: ${vehicle.ano_fabricacao}/${vehicle.ano_modelo}\n🛣️ ${km}\n💰 *${price}*\n\nVenda ou Compre seu carro rápido e seguro.\n\n${vehicleUrl}`
  }

  const handleShare = async () => {
    const text = getShareText()
    const url = vehicleUrl
    const title = `${vehicle.marca} ${vehicle.modelo}`

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        trackCTAClick('Compartilhar Veículo (Nativo)', '/veiculo')
      } catch (err) {
        console.error('Error sharing', err)
      }
    } else {
      navigator.clipboard.writeText(text)
      trackCTAClick('Compartilhar Veículo (Copiado)', '/veiculo')
      alert('Texto copiado para a área de transferência!')
    }
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicle.marca} ${vehicle.modelo} ${vehicle.versao}`,
    image: photos.length > 0 ? photos[0] : undefined,
    description: vehicle.descricao || `Compre ${vehicle.marca} ${vehicle.modelo} na Carro e Cia.`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: vehicle.preco_venda || 0,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Carro e Cia Veículos',
      },
    },
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      <SEO
        title={`${vehicle.marca} ${vehicle.modelo} ${vehicle.versao || ''} ${vehicle.ano_modelo || ''} à venda em Uberaba | Carro e Cia Motors`}
        description={`Confira as fotos e detalhes deste lindo ${vehicle.marca} ${vehicle.modelo} no valor de ${formatCurrency(vehicle.preco_venda || 0)}. Financiamos e aceitamos troca. Entre em contato!`}
        ogTitle={`${vehicle.marca} ${vehicle.modelo} (${vehicle.ano_modelo || vehicle.ano_fabricacao || ''}) - ${formatCurrency(vehicle.preco_venda || 0)}`}
        ogDescription={`Veja a ficha completa e simule as parcelas deste veículo em nosso site comercial Carro e Cia Motors.`}
        image={getSocialImageUrl(photos.length > 0 ? photos[0] : undefined)}
        canonical={vehicleUrl}
        schema={schema}
      />
      <div className="container py-6">
        <Link
          to="/estoque"
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para o estoque
        </Link>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
          <div className="space-y-4 w-full min-w-0">
            <Carousel setApi={setApi} className="w-full relative group">
              <CarouselContent>
                {photos.length > 0 ? (
                  photos.map((p: string, i: number) => (
                    <CarouselItem key={i}>
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative w-full">
                        <img
                          src={p}
                          alt={`Foto ${i + 1} do veículo ${vehicle.marca} ${vehicle.modelo}`}
                          width="800"
                          height="600"
                          loading={i === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative w-full">
                      <img
                        src="https://img.usecurling.com/p/800/600?q=car"
                        alt="Sem foto"
                        width="800"
                        height="600"
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
              {photos.length > 1 && (
                <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                  <CarouselPrevious className="left-4 bg-background/80 hover:bg-background border-none" />
                  <CarouselNext className="right-4 bg-background/80 hover:bg-background border-none" />
                </div>
              )}
            </Carousel>

            {photos.length > 1 && (
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mt-4">
                {photos.map((p: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`aspect-video rounded-md overflow-hidden border-2 transition-all ${
                      activePhoto === i
                        ? 'border-primary'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={p}
                      alt={`Miniatura ${i + 1} do ${vehicle.modelo}`}
                      width="160"
                      height="90"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {vehicle.video_url && (
              <div className="mt-8 aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  title={`Vídeo de apresentação do veículo ${vehicle.marca} ${vehicle.modelo}`}
                  src={vehicle.video_url}
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
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

            <div className="bg-card rounded-xl p-6 border shadow-sm mb-8 w-full min-w-0">
              <div className="flex flex-col gap-1 mb-6">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Preço de Venda
                </span>
                <span className="text-4xl font-bold text-primary">
                  {formatCurrency(vehicle.preco_venda || 0)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-y-6 mb-8 py-6 border-y">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-muted p-2 rounded-lg shrink-0">
                    <Calendar className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground">Ano</p>
                    <p
                      className="font-bold truncate"
                      title={`${vehicle.ano_fabricacao}/${vehicle.ano_modelo}`}
                    >
                      {vehicle.ano_fabricacao}/{vehicle.ano_modelo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-muted p-2 rounded-lg shrink-0">
                    <Gauge className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground">Quilometragem</p>
                    <p
                      className="font-bold truncate"
                      title={`${vehicle.quilometragem?.toLocaleString('pt-BR') || 0} km`}
                    >
                      {vehicle.quilometragem?.toLocaleString('pt-BR') || 0} km
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-muted p-2 rounded-lg shrink-0">
                    <Cog className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground">Câmbio</p>
                    <p className="font-bold truncate" title={vehicle.cambio}>
                      {vehicle.cambio}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-muted p-2 rounded-lg shrink-0">
                    <Fuel className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground">Combustível</p>
                    <p className="font-bold truncate" title={vehicle.combustivel}>
                      {vehicle.combustivel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-muted p-2 rounded-lg shrink-0">
                    <PaintBucket className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground">Cor</p>
                    <p className="font-bold truncate" title={vehicle.cor}>
                      {vehicle.cor}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-muted p-2 rounded-lg shrink-0">
                    <DoorOpen className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground">Portas</p>
                    <p className="font-bold truncate" title={vehicle.portas}>
                      {vehicle.portas}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    asChild
                    className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white h-14 text-lg"
                  >
                    <a
                      href={`https://wa.me/5534999484285?text=${encodeURIComponent(wppText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackWhatsAppClick('Luiz', 'botao_veiculo')}
                    >
                      Tenho Interesse
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 shrink-0 text-primary border-primary/20 hover:bg-primary/5"
                    onClick={handleShare}
                    title="Compartilhar"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

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
                          <label className="text-sm font-bold mb-2 block text-muted-foreground">
                            Valor do Veículo
                          </label>
                          <div className="h-12 bg-muted flex items-center px-3 rounded-md font-bold text-lg">
                            {formatCurrency(vehicle.preco_venda || 0)}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-bold mb-2 block">
                            Valor de Entrada (R$)
                          </label>
                          <Input
                            type="number"
                            placeholder="Ex: 20000"
                            value={simEntrada}
                            onChange={(e) => setSimEntrada(e.target.value)}
                            className="h-12 text-lg font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold mb-2 block">Número de Parcelas</label>
                          <Select value={simParcelas} onValueChange={setSimParcelas}>
                            <SelectTrigger className="h-12 text-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12x</SelectItem>
                              <SelectItem value="24">24x</SelectItem>
                              <SelectItem value="36">36x</SelectItem>
                              <SelectItem value="48">48x</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {simValue > 0 && simEntrada && (
                        <div className="bg-muted p-4 rounded-xl text-center border border-primary/20">
                          <p className="text-sm text-muted-foreground mb-1">
                            Resultado estimado da parcela:
                          </p>
                          <p className="text-3xl font-extrabold text-primary">
                            {simParcelas}x de {formatCurrency(simParcela)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            * Valores sujeitos a análise de crédito pelas financeiras.
                          </p>
                        </div>
                      )}

                      <Button
                        asChild
                        className="w-full h-14 text-lg font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white uppercase tracking-wide"
                      >
                        <a
                          href={`https://wa.me/5534999484285?text=${encodeURIComponent(wppSimText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleSimulationWhatsApp}
                        >
                          Simule Agora
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
            <h2 className="text-2xl font-display font-bold mb-6">Diferenciais do Veículo</h2>
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
            <h2 className="text-2xl font-display font-bold mb-6">Descrição</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {vehicle.descricao || 'Sem descrição detalhada.'}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-20 pt-10 border-t">
            <h2 className="text-2xl font-display font-bold mb-8">Veículos Similares</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTAs for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)] p-3 grid grid-cols-2 gap-3 pb-safe">
        <Button
          asChild
          variant="outline"
          className="h-12 border-primary text-primary hover:bg-primary/5"
        >
          <a href="tel:+5534999484285">
            <Phone className="w-4 h-4 mr-2" /> Ligar
          </a>
        </Button>
        <Button asChild className="h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white">
          <a
            href={`https://wa.me/5534999484285?text=${encodeURIComponent(wppText)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick('Luiz', 'bottom_nav_veiculo')}
          >
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </a>
        </Button>
      </div>
    </div>
  )
}
