import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase/client'
import { Filter, Search, Car, Calendar, Gauge, Fuel } from 'lucide-react'
import { trackCTAClick } from '@/lib/tracking'

export default function Estoque() {
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [marca, setMarca] = useState('Todas')
  const [maxPrice, setMaxPrice] = useState([300000])

  useEffect(() => {
    supabase
      .from('veiculos')
      .select(
        'id, marca, modelo, versao, ano_fabricacao, ano_modelo, preco_venda, quilometragem, combustivel, cor, fotos, is_zero_km, status',
      )
      .eq('status', 'disponivel')
      .order('destaque', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setVeiculos(data || [])
        setLoading(false)
      })
  }, [])

  const marcas = ['Todas', ...Array.from(new Set(veiculos.map((v) => v.marca)))]

  const filteredVeiculos = veiculos.filter((v) => {
    const s = searchTerm.toLowerCase()
    const matchSearch = v.marca.toLowerCase().includes(s) || v.modelo.toLowerCase().includes(s)
    const matchMarca = marca === 'Todas' || v.marca === marca
    const matchPrice = (v.preco_venda || 0) <= maxPrice[0]
    return matchSearch && matchMarca && matchPrice
  })

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
        <Label>Preço Máximo: R$ {maxPrice[0].toLocaleString('pt-BR')}</Label>
        <Slider value={maxPrice} onValueChange={setMaxPrice} max={500000} step={10000} />
      </div>
      {/* Mais filtros podem ser adicionados aqui conforme PROMPT 27 */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setMarca('Todas')
          setMaxPrice([300000])
          setSearchTerm('')
        }}
      >
        Limpar Filtros
      </Button>
    </div>
  )

  return (
    <main className="flex-1 bg-muted/10 pt-24 pb-16">
      <SEO
        title="Carros em Estoque | Consignação em Uberaba - Carro e Cia"
        description="Confira nosso estoque de carros em Uberaba. Procedência verificada, preços justos, financiamento facilitado. Carro e Cia."
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
          {/* Desktop Filters */}
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
                  placeholder="Buscar por marca ou modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-12"
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-12 md:hidden">
                    <Filter className="w-4 h-4 mr-2" /> Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader className="mb-6">
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <FiltersContent />
                </SheetContent>
              </Sheet>
            </div>

            <div className="mb-6 text-sm text-muted-foreground font-medium">
              Mostrando {filteredVeiculos.length} carros
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="h-80 animate-pulse bg-muted/50 border-0" />
                ))}
              </div>
            ) : filteredVeiculos.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Nenhum veículo encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Tente ajustar seus filtros ou limpar a busca.
                </p>
                <Button
                  onClick={() => {
                    setMarca('Todas')
                    setMaxPrice([300000])
                    setSearchTerm('')
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVeiculos.map((v) => {
                  const fotoPrincipal =
                    Array.isArray(v.fotos) && v.fotos.length > 0
                      ? v.fotos[0]
                      : 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp'
                  return (
                    <Card
                      key={v.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 group flex flex-col"
                    >
                      <Link
                        to={`/estoque/${v.id}`}
                        className="block relative aspect-[4/3] overflow-hidden bg-muted"
                        onClick={() =>
                          trackCTAClick(`Ver Veiculo: ${v.marca} ${v.modelo}`, '/estoque')
                        }
                      >
                        {v.is_zero_km && (
                          <Badge className="absolute top-3 left-3 z-10 bg-primary">0 KM</Badge>
                        )}
                        <img
                          src={fotoPrincipal}
                          alt={`${v.marca} ${v.modelo}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </Link>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="mb-3">
                          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                            {v.marca} {v.modelo}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{v.versao}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground mb-4 mt-auto">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> {v.ano_fabricacao}/{v.ano_modelo}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5" />{' '}
                            {v.quilometragem?.toLocaleString('pt-BR') || 0} km
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Fuel className="w-3.5 h-3.5" /> {v.combustivel || 'N/I'}
                          </div>
                          <div className="flex items-center gap-1.5 truncate text-ellipsis">
                            C: {v.cor || 'N/I'}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
                          <div className="font-bold text-xl text-primary">
                            {v.preco_venda
                              ? `R$ ${v.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : 'Consulte'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {!loading && filteredVeiculos.length > 0 && (
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
