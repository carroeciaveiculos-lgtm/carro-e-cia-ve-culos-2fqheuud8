import { useState, useEffect, useRef } from 'react'
import { SEO } from '@/components/SEO'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { normalizeValue } from '@/lib/ml-normalize'
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
  MessageCircle,
  ShieldCheck,
  FileCheck,
} from 'lucide-react'
import { trackCTAClick } from '@/lib/tracking'
import { toast } from 'sonner'
import { handleImageError, CAR_PLACEHOLDER_IMAGE, getImageUrl } from '@/lib/image-utils'
import { handleShareCTA } from '@/lib/cta-router'
import { buildVehicleTitle } from '@/lib/vehicle-title'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { coverPositionRef, onCoverPositionLoad } from '@/lib/image-cover-position'
import { TestimonialBanner } from '@/components/estoque/TestimonialBanner'

// Aumentado de 12 pra 48 (12/08/2026, pedido da Adriana) — o estoque atual
// (27 veículos) inteiro cabe numa página só, sem precisar paginar.
const PAGE_SIZE = 48

const VEHICLE_FIELDS =
  'id, slug, marca, modelo, versao, ano_fabricacao, ano_modelo, preco_venda, quilometragem, combustivel, cambio, cor, fotos, videos, is_zero_km, status, is_consignado, categoria, exibir_no_site, nao_exibir_km, em_preparacao, garantia, laudo_cautelar, tag_promocional'

const TAG_STYLES: Record<string, string> = {
  oferta: 'bg-red-600',
  novidade: 'bg-blue-600',
  reservado: 'bg-gray-500',
}
const TAG_LABELS: Record<string, string> = {
  oferta: 'OFERTA',
  novidade: 'NOVIDADE',
  reservado: 'RESERVADO',
}

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
  const [priceCeiling, setPriceCeiling] = useState(1000000)

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
        .select('marca, ano_fabricacao, combustivel, categoria, preco_venda')
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
        const maiorPreco = Math.max(0, ...data.map((v) => v.preco_venda || 0))
        const ceiling =
          maiorPreco > 0 ? Math.ceil((maiorPreco * 1.1) / 10000) * 10000 : 1000000
        setPriceCeiling(ceiling)
        setMaxPrice([ceiling])
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
      // busca_normalizada cobre marca+modelo+versao+placa sem acento -- antes
      // so olhava marca/modelo/placa, entao um termo que so existe na Versao
      // (ex: "automatico", "hibrido") nunca encontrava o veiculo.
      query = query.ilike('busca_normalizada', `%${normalizeValue(debouncedSearch) || ''}%`)
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
    setMaxPrice([priceCeiling])
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
        <Slider value={maxPrice} onValueChange={setMaxPrice} max={priceCeiling} step={10000} />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[50000, 100000, 200000, priceCeiling].map((valor) => (
            <Button
              key={valor}
              type="button"
              size="sm"
              variant={maxPrice[0] === valor ? 'default' : 'outline'}
              className="h-7 text-xs px-2.5"
              onClick={() => setMaxPrice([valor])}
            >
              {valor === priceCeiling ? 'Todos' : `Até ${valor / 1000}k`}
            </Button>
          ))}
        </div>
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
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <Card key={i} className="h-[460px] animate-pulse bg-muted/50 border-0" />
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
                {veiculos.flatMap((v, vehicleIndex) => {
                  const fotos =
                    Array.isArray(v.fotos) && v.fotos.length > 0
                      ? v.fotos
                      : [CAR_PLACEHOLDER_IMAGE]
                  const card = (
                    <Card
                      key={v.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 group flex flex-col w-full"
                    >
                      {/* Corrigido em 12/08/2026: o zoom de hover estava no
                          container (sem overflow-hidden), então a "caixa"
                          inteira crescia 5% e invadia a descrição/preço
                          abaixo. Movido pro <img> (ver mais abaixo), igual
                          já era feito certo em VehicleCard.tsx. */}
                      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
                          {v.is_zero_km && <Badge className="bg-primary">0 KM</Badge>}
                          {(v as any).em_preparacao && !v.is_zero_km && (
                            <Badge className="bg-amber-500">Em Preparação</Badge>
                          )}
                          {(v as any).garantia && (
                            <Badge className="bg-slate-900 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Garantia
                            </Badge>
                          )}
                          {(v as any).laudo_cautelar && (
                            <Badge className="bg-slate-900 flex items-center gap-1">
                              <FileCheck className="w-3 h-3" /> Laudo Cautelar
                            </Badge>
                          )}
                        </div>
                        {(v as any).tag_promocional && (
                          <Badge
                            className={`absolute bottom-3 left-3 z-10 ${TAG_STYLES[(v as any).tag_promocional] || 'bg-gray-500'}`}
                          >
                            {TAG_LABELS[(v as any).tag_promocional] || (v as any).tag_promocional}
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
                        <Link
                          to={`/estoque/${v.slug || v.id}`}
                          onClick={() =>
                            trackCTAClick(`Ver Veiculo: ${v.marca} ${v.modelo}`, '/estoque')
                          }
                          className="w-full h-full block"
                        >
                          {fotos[0].match(/\.(mp4|mov|webm)$/i) ? (
                            <video
                              src={fotos[0]}
                              className="w-full aspect-video object-cover"
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              ref={coverPositionRef}
                              src={
                                fotos[0].startsWith('http')
                                  ? getImageUrl(fotos[0], 'media', { width: 400 })
                                  : fotos[0]
                              }
                              alt={`${v.marca} ${v.modelo}`}
                              className="w-full h-full object-cover object-[center_65%] group-hover:scale-105 transition-transform duration-500"
                              loading={vehicleIndex === 0 ? 'eager' : 'lazy'}
                              decoding="async"
                              fetchPriority={vehicleIndex === 0 ? 'high' : 'auto'}
                              onLoad={onCoverPositionLoad}
                              onError={(e) =>
                                handleImageError(e.currentTarget, `${v.marca} ${v.modelo}`)
                              }
                            />
                          )}
                        </Link>
                      </div>
                      <CardContent className="p-3 flex-1 flex flex-col">
                        <div className="mb-3">
                          <h2 className="font-bold text-base md:text-lg leading-tight group-hover:text-primary transition-colors mb-3 min-h-10 md:min-h-[45px]">
                            {buildVehicleTitle([v.marca, v.modelo])}
                          </h2>
                          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[58px] content-start">
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

                        <div className="flex gap-2">
                          <Button
                            asChild
                            variant="outline"
                            className="flex-1 h-10 font-bold text-sm rounded-lg"
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
                          <Button
                            asChild
                            className="flex-1 h-10 font-bold text-sm rounded-lg bg-[#25D366] hover:bg-[#1ebe5a] text-white"
                          >
                            <a
                              href={getWhatsAppLink(
                                `Olá, tenho interesse no ${buildVehicleTitle([v.marca, v.modelo])} - ${v.ano_modelo || v.ano_fabricacao} no valor de ${v.preco_venda ? `R$ ${v.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'consulte'}`,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() =>
                                trackCTAClick(`WhatsApp Card: ${v.marca} ${v.modelo}`, '/estoque')
                              }
                            >
                              <MessageCircle className="w-4 h-4 mr-1.5" />
                              WhatsApp
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                  return vehicleIndex > 0 && (vehicleIndex + 1) % 6 === 0
                    ? [card, <TestimonialBanner key={`depoimento-${vehicleIndex}`} />]
                    : [card]
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
                  <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white">
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
