import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { VehicleCard } from '@/components/VehicleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { getMarcas, getModelos } from '@/services/fipe'
import { Filter, Search, LayoutGrid, List } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { SEO } from '@/components/SEO'

export default function Estoque() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [marcas, setMarcas] = useState<any[]>([])
  const [modelos, setModelos] = useState<any[]>([])

  const [filters, setFilters] = useState({
    marca: searchParams.get('marca') || '',
    modelo: searchParams.get('modelo') || '',
    precoMin: searchParams.get('precoMin') || '',
    precoMax: searchParams.get('precoMax') || '',
    anoMin: searchParams.get('anoMin') || '',
    anoMax: searchParams.get('anoMax') || '',
    cambio: searchParams.getAll('cambio') || [],
    combustivel: searchParams.getAll('combustivel') || [],
    kmMax: searchParams.get('kmMax') ? parseInt(searchParams.get('kmMax')!) : 300000,
    ordem: searchParams.get('ordem') || 'recentes',
  })

  useEffect(() => {
    getMarcas().then(setMarcas).catch(console.error)
  }, [])

  useEffect(() => {
    if (filters.marca) {
      const m = marcas.find((x) => x.nome === filters.marca)
      if (m) getModelos(m.codigo).then(setModelos).catch(console.error)
    }
  }, [filters.marca, marcas])

  const fetchVehicles = async () => {
    setLoading(true)
    let query = supabase.from('veiculos').select('*').in('status', ['disponivel', 'reservado'])

    if (filters.marca && filters.marca !== 'todas') query = query.eq('marca', filters.marca)
    if (filters.modelo && filters.modelo !== 'todos') query = query.eq('modelo', filters.modelo)
    if (filters.precoMin) query = query.gte('preco_venda', filters.precoMin)
    if (filters.precoMax) query = query.lte('preco_venda', filters.precoMax)
    if (filters.anoMin) query = query.gte('ano_fabricacao', filters.anoMin)
    if (filters.anoMax) query = query.lte('ano_fabricacao', filters.anoMax)
    if (filters.kmMax < 300000) query = query.lte('quilometragem', filters.kmMax)
    if (filters.cambio.length > 0) query = query.in('cambio', filters.cambio)
    if (filters.combustivel.length > 0) query = query.in('combustivel', filters.combustivel)

    if (filters.ordem === 'menor_preco') query = query.order('preco_venda', { ascending: true })
    else if (filters.ordem === 'maior_preco')
      query = query.order('preco_venda', { ascending: false })
    else if (filters.ordem === 'menor_km') query = query.order('quilometragem', { ascending: true })
    else query = query.order('created_at', { ascending: false })

    const { data } = await query
    if (data) {
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase()
        setVehicles(
          data.filter(
            (v) =>
              v.marca.toLowerCase().includes(lowerQ) ||
              v.modelo.toLowerCase().includes(lowerQ) ||
              v.ano_fabricacao?.toString().includes(lowerQ),
          ),
        )
      } else {
        setVehicles(data)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()

    const params = new URLSearchParams()
    if (filters.marca && filters.marca !== 'todas') params.set('marca', filters.marca)
    if (filters.modelo && filters.modelo !== 'todos') params.set('modelo', filters.modelo)
    if (filters.precoMin) params.set('precoMin', filters.precoMin)
    if (filters.precoMax) params.set('precoMax', filters.precoMax)
    if (filters.kmMax < 300000) params.set('kmMax', filters.kmMax.toString())
    if (filters.ordem && filters.ordem !== 'recentes') params.set('ordem', filters.ordem)
    filters.cambio.forEach((c) => params.append('cambio', c))
    filters.combustivel.forEach((c) => params.append('combustivel', c))

    // Only set if there are params, else clear it to keep URL clean
    if (params.toString()) {
      setSearchParams(params, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [filters, searchQuery])

  const toggleArrayFilter = (key: 'cambio' | 'combustivel', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }))
  }

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name: 'Carro e Cia Veículos',
      description:
        'Estoque de carros usados e seminovos com procedência garantida em Uberaba MG. Financiamento facilitado.',
      url: 'https://carroeciamotors.com.br/estoque',
      telephone: '+5534999484285',
      image:
        'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Guilherme Ferreira, 1119',
        addressLocality: 'Uberaba',
        addressRegion: 'MG',
        addressCountry: 'BR',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: 'https://carroeciamotors.com.br',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Estoque',
          item: 'https://carroeciamotors.com.br/estoque',
        },
      ],
    },
  ]

  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="space-y-8 pb-8">
      <div>
        <h3 className="font-bold mb-4">Marca e Modelo</h3>
        <div className="space-y-4">
          <Select
            value={filters.marca || 'todas'}
            onValueChange={(v) =>
              setFilters({ ...filters, marca: v === 'todas' ? '' : v, modelo: '' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as Marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Marcas</SelectItem>
              {marcas.map((m) => (
                <SelectItem key={m.codigo} value={m.nome}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.modelo || 'todos'}
            onValueChange={(v) => setFilters({ ...filters, modelo: v === 'todos' ? '' : v })}
            disabled={!filters.marca}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os Modelos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Modelos</SelectItem>
              {modelos.map((m) => (
                <SelectItem key={m.codigo} value={m.nome}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">Preço</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.precoMin}
            onChange={(e) => setFilters({ ...filters, precoMin: e.target.value })}
          />
          <span>-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.precoMax}
            onChange={(e) => setFilters({ ...filters, precoMax: e.target.value })}
          />
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">Ano</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="De"
            value={filters.anoMin}
            onChange={(e) => setFilters({ ...filters, anoMin: e.target.value })}
          />
          <span>-</span>
          <Input
            type="number"
            placeholder="Até"
            value={filters.anoMax}
            onChange={(e) => setFilters({ ...filters, anoMax: e.target.value })}
          />
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">
          KM Máximo: {filters.kmMax === 300000 ? 'Qualquer' : filters.kmMax.toLocaleString()}
        </h3>
        <Slider
          value={[filters.kmMax]}
          max={300000}
          step={10000}
          onValueChange={(v) => setFilters({ ...filters, kmMax: v[0] })}
        />
      </div>

      <div>
        <h3 className="font-bold mb-4">Câmbio</h3>
        <div className="space-y-2">
          {['Manual', 'Automático', 'CVT', 'Dupla Embreagem'].map((c) => (
            <div key={c} className="flex items-center gap-2">
              <Checkbox
                id={`c-${c}`}
                checked={filters.cambio.includes(c)}
                onCheckedChange={() => toggleArrayFilter('cambio', c)}
              />
              <Label htmlFor={`c-${c}`}>{c}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">Combustível</h3>
        <div className="space-y-2">
          {['Flex', 'Gasolina', 'Etanol', 'Diesel', 'Elétrico'].map((c) => (
            <div key={c} className="flex items-center gap-2">
              <Checkbox
                id={`f-${c}`}
                checked={filters.combustivel.includes(c)}
                onCheckedChange={() => toggleArrayFilter('combustivel', c)}
              />
              <Label htmlFor={`f-${c}`}>{c}</Label>
            </div>
          ))}
        </div>
      </div>

      {!isMobile && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            setFilters({
              marca: '',
              modelo: '',
              precoMin: '',
              precoMax: '',
              anoMin: '',
              anoMax: '',
              cambio: [],
              combustivel: [],
              kmMax: 300000,
              ordem: 'recentes',
            })
          }
        >
          Limpar Filtros
        </Button>
      )}
    </div>
  )

  return (
    <div className="container py-8 lg:py-12">
      <SEO
        title="Carros Usados de Qualidade em Uberaba | Carro e Cia"
        description="Estoque de veículos usados - Carro e Cia. Confira nossa seleção de carros de qualidade. Filtros por marca, modelo e preço."
        schema={schema}
      />
      <div className="flex flex-col mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-display font-bold">Nosso Estoque</h1>
            <p className="text-sm text-muted-foreground">{vehicles.length} veículos disponíveis</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-accent text-white' : ''}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-accent text-white' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Buscar por modelo, marca ou ano..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="md:hidden flex-1">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="w-full h-12 flex gap-2">
                    <Filter className="w-4 h-4" /> Filtrar
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[85vh]">
                  <DrawerHeader>
                    <DrawerTitle>Filtros</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 overflow-y-auto flex-1">
                    <FilterSidebar isMobile={true} />
                  </div>
                  <DrawerFooter className="pt-2 border-t">
                    <DrawerClose asChild>
                      <Button className="w-full h-[52px]">Aplicar filtros</Button>
                    </DrawerClose>
                    <Button
                      variant="outline"
                      className="w-full h-[52px]"
                      onClick={() =>
                        setFilters({
                          marca: '',
                          modelo: '',
                          precoMin: '',
                          precoMax: '',
                          anoMin: '',
                          anoMax: '',
                          cambio: [],
                          combustivel: [],
                          kmMax: 300000,
                          ordem: 'recentes',
                        })
                      }
                    >
                      Limpar Filtros
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>

            <Select
              value={filters.ordem}
              onValueChange={(v) => setFilters({ ...filters, ordem: v })}
            >
              <SelectTrigger className="w-[160px] md:w-[200px] h-12">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais Recentes</SelectItem>
                <SelectItem value="menor_preco">Menor Preço</SelectItem>
                <SelectItem value="maior_preco">Maior Preço</SelectItem>
                <SelectItem value="menor_km">Menor KM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
        <div className="hidden lg:block sticky top-24 bg-card p-6 rounded-xl border">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold font-display">Filtros</h2>
          </div>
          <FilterSidebar />
        </div>

        <div>
          {loading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
              }
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={`animate-pulse bg-muted rounded-xl ${
                    viewMode === 'grid' ? 'h-[400px]' : 'h-[160px]'
                  }`}
                />
              ))}
            </div>
          ) : vehicles.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'flex flex-col gap-4'
              }
            >
              {vehicles.map((v) => (
                <div key={v.id} className={viewMode === 'list' ? 'md:max-w-3xl' : ''}>
                  <VehicleCard vehicle={v} isList={viewMode === 'list'} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Nenhum veículo encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar seus filtros para ver mais resultados.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() =>
                  setFilters({
                    marca: '',
                    modelo: '',
                    precoMin: '',
                    precoMax: '',
                    anoMin: '',
                    anoMax: '',
                    cambio: [],
                    combustivel: [],
                    kmMax: 300000,
                    ordem: 'recentes',
                  })
                }
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
