import { useState, useMemo } from 'react'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { mockVehicles } from '@/lib/mock-data'
import { VehicleCard } from '@/components/VehicleCard'

const Estoque = () => {
  const [search, setSearch] = useState('')
  const [priceRange, setPriceRange] = useState([0, 300000])
  const [brand, setBrand] = useState('todas')
  const [year, setYear] = useState('todos')

  const filteredVehicles = useMemo(() => {
    return mockVehicles.filter((v) => {
      const matchSearch =
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        v.brand.toLowerCase().includes(search.toLowerCase())
      const matchBrand = brand === 'todas' || v.brand.toLowerCase() === brand.toLowerCase()
      const matchYear = year === 'todos' || v.year.includes(year)
      const matchPrice = v.price >= priceRange[0] && v.price <= priceRange[1]
      return matchSearch && matchBrand && matchYear && matchPrice
    })
  }, [search, brand, year, priceRange])

  const FilterContent = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg border-b pb-2">Filtros</h3>

        <div className="space-y-2">
          <Label>Marca</Label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Marcas</SelectItem>
              <SelectItem value="toyota">Toyota</SelectItem>
              <SelectItem value="jeep">Jeep</SelectItem>
              <SelectItem value="honda">Honda</SelectItem>
              <SelectItem value="volkswagen">Volkswagen</SelectItem>
              <SelectItem value="chevrolet">Chevrolet</SelectItem>
              <SelectItem value="hyundai">Hyundai</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ano</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Anos</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <Label>Faixa de Preço</Label>
            <span className="text-xs text-muted-foreground font-medium">
              Até R$ {priceRange[1].toLocaleString('pt-BR')}
            </span>
          </div>
          <Slider
            min={0}
            max={300000}
            step={5000}
            value={priceRange}
            onValueChange={setPriceRange}
            className="my-4"
          />
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setBrand('todas')
          setYear('todos')
          setPriceRange([0, 300000])
          setSearch('')
        }}
      >
        Limpar Filtros
      </Button>
    </div>
  )

  return (
    <div className="pt-24 pb-20 bg-muted/20 min-h-screen">
      <div className="container">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-4">Nosso Estoque</h1>
          <p className="text-muted-foreground">
            Encontre o veículo ideal para você com garantia de procedência.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-28 bg-card p-6 rounded-xl border shadow-sm">
              <FilterContent />
            </div>
          </aside>

          <main className="flex-1">
            {/* Search & Mobile Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Buscar por marca ou modelo..."
                  className="pl-10 h-12 text-base bg-card"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-12 lg:hidden flex gap-2">
                    <SlidersHorizontal className="w-4 h-4" /> Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <FilterContent />
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Grid */}
            <div className="mb-6 text-sm text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{filteredVehicles.length}</span>{' '}
              veículos
            </div>

            {filteredVehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-display font-semibold text-xl mb-2">
                  Nenhum veículo encontrado
                </h3>
                <p className="text-muted-foreground">Tente ajustar seus filtros de busca.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
import { Car } from 'lucide-react'
export default Estoque
