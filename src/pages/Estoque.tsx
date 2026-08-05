import { useState, useEffect, useRef } from 'react'
import { SEO } from '@/components/SEO'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase/client'
import {
  Filter,
  Search,
  Car,
  Share2,
  CalendarDays,
  Settings2,
  Fuel,
  Gauge,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { trackCTAClick } from '@/lib/tracking'
import { toast } from 'sonner'
import { handleImageError, CAR_PLACEHOLDER_IMAGE } from '@/lib/image-utils'
import { handleShareCTA } from '@/lib/cta-router'
import { buildVehicleTitle, getVersaoComplementar } from '@/lib/vehicle-title'

const PAGE_SIZE = 10

const VEHICLE_FIELDS =
  'id, slug, marca, modelo, versao, ano_fabricacao, ano_modelo, preco_venda, quilometragem, combustivel, cambio, cor, fotos, videos, is_zero_km, status, is_consignado, categoria, exibir_no_site, nao_exibir_km, em_preparacao'

export default function Estoque() {
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [marca, setMarca] = useState('Todas')
  const [ano, setAno] = useState('Todos')
  const [combustivel, setCombustivel] = useState('Todos')
  const [categoria, setCategoria] = useState('Todas')
  const [maxPrice, setMaxPrice] = useState([1000000])

  const [marcas, setMarcas] = useState<string[]>(['Todas'])
  const [anos, setAnos] = useState<string[]>(['Todos'])
  const [combustiveis, setCombustiveis] = useState<string[]>(['Todos'])
  const [categorias, setCategorias] = useState<string[]>(['Todas'])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase
        .from('veiculos')
        .select('marca, ano_fabricacao, combustivel, categoria')
        .eq('status', 'disponivel')
        .eq('exibir_no_site', true)
      if (data) {
        setMarcas(['Todas', ...Array.from(new Set(data.map((v) => v.marca).filter(Boolean)))])
        setAnos([
          'Todos',
          ...Array.from(new Set(data.map((v) => v.ano_fabricacao?.toString()).filter(Boolean)))
            .sort()
            .reverse(),
        ])
        setCombustiveis([
          'Todos',
          ...Array.from(new Set(data.map((v) => v.combustivel).filter(Boolean))),
        ])
        setCategorias([
          'Todas',
          ...Array.from(new Set(data.map((v) => v.categoria).filter(Boolean))),
        ])
      }
    }
    fetchOptions()
  }, [])

  const fetchVeiculos = async (pageNum: number) => {
    setLoading(true)
    const offset = pageNum * PAGE_SIZE

    let query = supabase
      .from('veiculos')
      .select(VEHICLE_FIELDS, { count: 'exact' })
      .eq('status', 'disponivel')
      .eq('exibir_no_site', true)

    if (debouncedSearch) {
      query = query.or(
        `marca.ilike.%${debouncedSearch}%,modelo.ilike.%${debouncedSearch}%,placa.ilike.%${debouncedSearch}%`,
      )
    }
    if (marca !== 'Todas') query = query.eq('marca', marca)
    if (ano !== 'Todos') query = query.eq('ano_fabricacao', parseInt(ano))
    if (combustivel !== 'Todos') query = query.eq('combustivel', combustivel)
    if (categoria !== 'Todas') query = query.eq('categoria', categoria)
    query = query.lte('preco_venda', maxPrice[0])

    query = query
      .order('destaque', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    const { data, error, count } = await query

    if (error) {
      const is416 =
        error.code === 'PGRST103' ||
        (error as any)?.status === 416 ||
        String(error.message || '').includes('PGRST103')

      if (is416 && pageNum > 0) {
        setPage(0)
        fetchVeiculos(0)
        return
      }
      setVeiculos([])
      setTotalCount(0)
      setLoading(false)
      return
    }

    setVeiculos(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  const mountedRef = useRef(false)
  const filterKey = `${debouncedSearch}|${marca}|${ano}|${combustivel}|${categoria}|${maxPrice[0]}`
  const prevFilterKey = useRef(filterKey)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      prevFilterKey.current = filterKey
      fetchVeiculos(0)
      return
    }
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey
      setPage(0)
      fetchVeiculos(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  const clearFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setMarca('Todas')
    setAno('Todos')
    setCombustivel('Todos')
    setCategoria('Todas')
    setMaxPrice([1000000])
    setPage(0)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const hasMore = page < totalPages - 1

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchVeiculos(newPage)
  }

  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Marca</Label>
        <Select value={marca} onValueChange={setMarca}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            {marcas.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Ano</Label>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            {anos.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Combustível</Label>
        <Select value={combustivel} onValueChange={setCombustivel}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            {combustiveis.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Preço Máximo: R$ {maxPrice[0].toLocaleString('pt-BR')}</Label>
        <Slider value={maxPrice} onValueChange={setMaxPrice} max={1000000} step={10000} />
      </div>
      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Limpar Filtros
      </Button>
    </div>
  )

  const MobileFilterButton = ({ label }: { label: string }) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full whitespace-nowrap border-border/50 shadow-sm text-xs px-4"
        >
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="mb-6">
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <FiltersContent />
      </SheetContent>
    </Sheet>
  )

  return (
    <main className="flex-1 bg-muted/10 pt-24 pb-16">
      <SEO
        title="Estoque de Carros Seminovos e Usados em Uberaba | Carro e Cia Motors"
        description="Confira o estoque de carros seminovos e usados selecionados da Carro e Cia Motors em Uberaba - MG. Veículos com procedência garantida e 1 ano de garantia de câmbio e motor."
      />

      <section className="container max-w-7xl mx-auto px-4 mb-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">
            Carros em Estoque
          </h1>
          <p className="text-lg text-muted-foreground">
            Procedência verificada. Preços justos. Financiamento facilitado.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <aside className="hidden md:block w-72 shrink-0 bg-card p-6 rounded-xl border shadow-sm sticky top-[100px]">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filtros
            </h2>
            <FiltersContent />
          </aside>

          <div className="flex-1 w-full">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por marca, modelo ou placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-12"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 md:hidden hide-scrollbar">
              <MobileFilterButton label="Preço" />
              <MobileFilterButton label="Marca" />
              <MobileFilterButton label="Ano" />
              <MobileFilterButton label="Combustível" />
              <Button
                variant="outline"
                size="sm"
                className="rounded-full whitespace-nowrap border-border/50 shadow-sm text-xs px-4"
                onClick={clearFilters}
              >
                Limpar
              </Button>
            </div>

            <div className="mb-4 text-sm text-muted-foreground font-medium">
              {totalCount > 0
                ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalCount)} de ${totalCount} carros`
                : 'Mostrando 0 carros'}
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="h-[420px] animate-pulse bg-muted/50 border-0" />
                ))}
              </div>
            ) : veiculos.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Nenhum veículo encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Tente ajustar seus filtros ou limpar a busca.
                </p>
                <Button onClick={clearFilters}>Limpar Filtros</Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {veiculos.map((v, vehicleIndex) => {
                  const fotos =
                    Array.isArray(v.fotos) && v.fotos.length > 0
                      ? v.fotos
                      : (v as any).em_preparacao
                        ? [
                            'https://img.usecurling.com/p/400/300?q=car%20detailing%20workshop&color=gray',
                          ]
                        : [CAR_PLACEHOLDER_IMAGE]
                  return (
                    <Card
                      key={v.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 group flex flex-col w-full"
                    >
                      <div className="relative w-full aspect-video bg-muted group-hover:scale-105 transition-transform duration-500">
                        {v.is_zero_km && (
                          <Badge className="absolute top-3 left-3 z-10 bg-primary">0 KM</Badge>
                        )}
                        {(v as any).em_preparacao && !v.is_zero_km && (
                          <Badge className="absolute top-3 left-3 z-10 bg-amber-500">
                            Em Preparação
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-3 right-3 z-10 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-sm w-8 h-8"
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const shared = await handleShareCTA(v, '/estoque')
                            if (!shared) {
                              toast.success('Link de compartilhamento copiado!')
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Carousel className="w-full h-full">
                          <CarouselContent className="h-full ml-0">
                            {fotos.map((url: string, index: number) => (
                              <CarouselItem key={index} className="pl-0 h-full">
                                <Link
                                  to={`/estoque/${v.slug || v.id}`}
                                  onClick={() =>
                                    trackCTAClick(`Ver Veiculo: ${v.marca} ${v.modelo}`, '/estoque')
                                  }
                                  className="w-full h-full block"
                                >
                                  {url.match(/\.(mp4|mov|webm)$/i) ? (
                                    <video
                                      src={url}
                                      className="w-full aspect-video object-cover"
                                      muted
                                      loop
                                      playsInline
                                    />
                                  ) : (
                                    <img
                                      src={url}
                                      alt={`${v.marca} ${v.modelo} - Foto ${index + 1}`}
                                      className="w-full aspect-video object-cover object-[center_65%] bg-muted max-w-[640px] mx-auto md:max-w-full"
                                      loading={vehicleIndex === 0 && index === 0 ? 'eager' : 'lazy'}
                                      fetchPriority={
                                        vehicleIndex === 0 && index === 0 ? 'high' : 'auto'
                                      }
                                      onError={(e) =>
                                        handleImageError(e.currentTarget, `${v.marca} ${v.modelo}`)
                                      }
                                    />
                                  )}
                                </Link>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          {fotos.length > 1 && (
                            <>
                              <CarouselPrevious className="left-2 bg-black/50 text-white border-0 hover:bg-black/70" />
                              <CarouselNext className="right-2 bg-black/50 text-white border-0 hover:bg-black/70" />
                            </>
                          )}
                        </Carousel>
                      </div>
                      <CardContent className="p-3 flex-1 flex flex-col">
                        <div className="mb-3">
                          <h2 className="font-bold text-base md:text-lg leading-tight group-hover:text-primary transition-colors mb-3">
                            {buildVehicleTitle([
                              v.marca,
                              v.modelo,
                              getVersaoComplementar(v.modelo, v.versao),
                            ])}
                          </h2>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge
                              variant="secondary"
                              className="bg-muted/50 text-muted-foreground text-xs font-medium flex items-center gap-1 py-1 px-2"
                            >
                              <CalendarDays className="w-3 h-3" /> {v.ano_fabricacao}/
                              {v.ano_modelo || v.ano_fabricacao}
                            </Badge>
                            {v.quilometragem != null && !v.nao_exibir_km && (
                              <Badge
                                variant="secondary"
                                className="bg-muted/50 text-muted-foreground text-xs font-medium flex items-center gap-1 py-1 px-2"
                              >
                                <Gauge className="w-3 h-3" />{' '}
                                {Number(v.quilometragem).toLocaleString('pt-BR')} KM
                              </Badge>
                            )}
                            {v.cambio && (
                              <Badge
                                variant="secondary"
                                className="bg-muted/50 text-muted-foreground text-xs font-medium flex items-center gap-1 py-1 px-2"
                              >
                                <Settings2 className="w-3 h-3" /> {v.cambio}
                              </Badge>
                            )}
                            {v.combustivel && (
                              <Badge
                                variant="secondary"
                                className="bg-muted/50 text-muted-foreground text-xs font-medium flex items-center gap-1 py-1 px-2"
                              >
                                <Fuel className="w-3 h-3" /> {v.combustivel}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="bg-muted/40 p-2.5 rounded-lg mb-3 mt-auto">
                          <p className="text-xl font-bold text-foreground m-0">
                            {v.preco_venda
                              ? `R$ ${v.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : 'Consulte'}
                          </p>
                        </div>

                        <Button
                          asChild
                          variant="outline"
                          className="w-full h-10 font-bold text-sm rounded-lg"
                        >
                          <Link
                            to={`/estoque/${v.slug || v.id}`}
                            onClick={() =>
                              trackCTAClick(`Ver Detalhes: ${v.marca} ${v.modelo}`, '/estoque')
                            }
                          >
                            Ver Detalhes
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => handlePageChange(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </Button>
                <span className="text-sm font-medium">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={!hasMore}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Próxima <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {!loading && totalCount > 0 && (
              <div className="mt-12 p-8 bg-primary/5 rounded-2xl border border-primary/20 text-center">
                <h3 className="text-2xl font-display font-bold mb-4">
                  Não encontrou o que procura?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Nós podemos encontrar para você ou ajudá-lo a vender o seu atual.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild>
                    <Link
                      to="/consignacao"
                      onClick={() => trackCTAClick('Consigne seu carro conosco', '/estoque')}
                    >
                      Consigne seu carro conosco
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/contato">Fale com nosso time</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
