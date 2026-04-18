import { useEffect, useState, useMemo } from 'react'
import { SEO } from '@/components/SEO'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { supabase } from '@/lib/supabase/client'
import { VehicleCard } from '@/components/VehicleCard'
import { CheckCircle2, FilterX, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CarrosSeminovosUberaba() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMarca, setSelectedMarca] = useState('all')
  const [selectedPreco, setSelectedPreco] = useState('all')

  useEffect(() => {
    supabase
      .from('veiculos')
      .select('*')
      .eq('status', 'disponivel')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setVehicles(data)
        setLoading(false)
      })
  }, [])

  const marcas = useMemo(() => {
    const unique = new Set(vehicles.map((v) => v.marca))
    return Array.from(unique).sort()
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.marca.toLowerCase().includes(searchTerm.toLowerCase())

      const matchMarca = selectedMarca === 'all' || v.marca === selectedMarca

      let matchPreco = true
      if (selectedPreco !== 'all') {
        const preco = v.preco_venda || 0
        if (selectedPreco === 'ate-50k') matchPreco = preco <= 50000
        if (selectedPreco === '50k-100k') matchPreco = preco > 50000 && preco <= 100000
        if (selectedPreco === 'acima-100k') matchPreco = preco > 100000
      }

      return matchSearch && matchMarca && matchPreco
    })
  }, [vehicles, searchTerm, selectedMarca, selectedPreco])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedMarca('all')
    setSelectedPreco('all')
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Carro e Cia Veículos',
    image: 'https://img.usecurling.com/p/800/600?q=car%20dealership',
    description:
      'Encontre os melhores carros seminovos em Uberaba MG com procedência, garantia e preço justo.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Uberaba',
      addressRegion: 'MG',
      addressCountry: 'BR',
    },
  }

  return (
    <main className="flex-1 bg-background">
      <SEO
        title="Carros Seminovos em Uberaba MG | Carro e Cia Veículos"
        description="Encontre os melhores carros seminovos em Uberaba MG com procedência, garantia e preço justo. Mais de 20 anos no mercado. Venha conhecer!"
        schema={schema}
      />

      <section className="relative py-20 bg-muted/40 border-b overflow-hidden">
        <div className="container relative z-10">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Início</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Carros Seminovos em Uberaba MG</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Carros Seminovos em Uberaba MG — Com Procedência, Garantia e Preço Justo
            </h1>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Você está procurando carros seminovos em Uberaba MG com segurança, procedência e preço
              justo? Na Carro e Cia Veículos você encontra exatamente o que precisa — sem surpresas,
              sem estresse e sem enrolação.
            </p>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Com mais de 20 anos de experiência no mercado de veículos usados em Uberaba e região,
              somos referência em qualidade, transparência e atendimento humanizado. Cada carro do
              nosso estoque passa por avaliação rigorosa antes de ser anunciado. Aqui você não
              compra um carro — você compra tranquilidade.
            </p>
            <Button size="lg" className="text-lg px-8 py-6 h-auto w-full sm:w-auto" asChild>
              <a
                href={getWhatsAppLink(
                  'Olá! Vi a página de carros seminovos e gostaria de ver o estoque.',
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Fale com a Carro e Cia pelo WhatsApp — Clique Aqui
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Seção de Estoque Dinâmico */}
      <section className="py-16 bg-background" id="estoque">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-display font-bold mb-4">Nosso Estoque de Seminovos</h2>
              <p className="text-muted-foreground">
                Encontre o carro perfeito para você com filtros fáceis de usar.
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-muted/30 p-6 rounded-xl border mb-10 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <label
                htmlFor="busca-veiculo"
                className="text-sm font-medium mb-2 block text-foreground"
              >
                Buscar Veículo
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="busca-veiculo"
                  placeholder="Ex: Civic, Corolla..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full md:w-1/4">
              <label
                htmlFor="filtro-marca"
                className="text-sm font-medium mb-2 block text-foreground"
              >
                Marca
              </label>
              <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                <SelectTrigger
                  id="filtro-marca"
                  aria-label="Filtro de Marca"
                  className="bg-background"
                >
                  <SelectValue placeholder="Todas as Marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Marcas</SelectItem>
                  {marcas.map((marca) => (
                    <SelectItem key={marca as string} value={marca as string}>
                      {marca as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/4">
              <label
                htmlFor="filtro-preco"
                className="text-sm font-medium mb-2 block text-foreground"
              >
                Faixa de Preço
              </label>
              <Select value={selectedPreco} onValueChange={setSelectedPreco}>
                <SelectTrigger
                  id="filtro-preco"
                  aria-label="Filtro de Preço"
                  className="bg-background"
                >
                  <SelectValue placeholder="Qualquer Preço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer Preço</SelectItem>
                  <SelectItem value="ate-50k">Até R$ 50.000</SelectItem>
                  <SelectItem value="50k-100k">R$ 50.000 a R$ 100.000</SelectItem>
                  <SelectItem value="acima-100k">Acima de R$ 100.000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full md:w-auto flex items-center gap-2 bg-background"
            >
              <FilterX className="w-4 h-4" />
              Limpar
            </Button>
          </div>

          {/* Grid de Veículos */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col space-y-3 bg-card rounded-lg overflow-hidden border p-0"
                >
                  <Skeleton className="h-[200px] w-full rounded-none" />
                  <div className="p-4 space-y-4 flex flex-col flex-grow">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="mt-auto pt-4">
                      <Skeleton className="h-8 w-1/3 mb-4" />
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredVehicles.length === 0 ? (
              <div className="col-span-full bg-muted/30 border border-dashed rounded-xl text-center py-16 text-muted-foreground">
                <p className="text-lg">Nenhum veículo encontrado com os filtros atuais.</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Limpar filtros
                </Button>
              </div>
            ) : (
              filteredVehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 container max-w-4xl border-t">
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl">
          <h2>Por que Comprar Seminovo na Carro e Cia Veículos?</h2>
          <p>
            Existem dezenas de opções para comprar carros usados em Uberaba MG. Mas existem poucos
            lugares onde você sai com a certeza de ter feito um bom negócio. A Carro e Cia é um
            desses lugares.
          </p>

          <div className="bg-muted/30 border border-border/50 rounded-2xl p-8 my-10 shadow-sm">
            <ul className="space-y-4 m-0 p-0 list-none">
              {[
                'Veículos com histórico verificado — sem passado escondido',
                'Documentação 100% regularizada — transferência sem burocracia',
                'Financiamento facilitado — inclusive na modalidade consignada',
                'Atendimento personalizado, sem pressão de venda',
                'Mais de 20 anos de confiança consolidada em Uberaba MG',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 m-0">
                  <CheckCircle2
                    className="w-6 h-6 text-primary flex-shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p>
            Quando você compra na Carro e Cia, você está comprando de quem conhece o mercado local
            de dentro para fora.
          </p>

          <h2>Carros Usados à Venda em Uberaba MG — Estoque Sempre Renovado</h2>
          <p>
            Nosso estoque é renovado constantemente com as melhores oportunidades da região. De
            hatches econômicos a SUVs e utilitários, você encontra o carro certo para o seu perfil e
            o seu bolso.
          </p>
          <p>Todos os nossos veículos passam por:</p>
          <ul>
            <li>Vistoria técnica completa</li>
            <li>Verificação de histórico de sinistros</li>
            <li>Conferência de documentação e multas</li>
            <li>Higienização e preparação para entrega</li>
          </ul>
          <p>
            Procurando um modelo específico? Entre em contato agora e nossa equipe te avisa assim
            que chegar no estoque.
          </p>

          <h2>Carros Semi Novos em Uberaba — Como Funciona a Compra?</h2>
          <p>Comprar um carro seminovo na Carro e Cia é simples, rápido e sem complicação:</p>
          <ol>
            <li>Você escolhe o veículo — presencialmente na loja ou pelo nosso site</li>
            <li>Nossa equipe apresenta toda a documentação e histórico do veículo</li>
            <li>
              Simulamos o financiamento nas melhores condições disponíveis — inclusive consignado
            </li>
            <li>Transferência rápida, segura e sem burocracia</li>
            <li>Você sai com o carro e a tranquilidade de ter feito um bom negócio</li>
          </ol>

          <div className="mt-16 p-10 bg-primary/5 border border-primary/20 rounded-2xl text-center shadow-sm">
            <h2 className="text-3xl font-bold mb-4 mt-0 text-foreground">
              Tem um Carro Para Dar Como Entrada?
            </h2>
            <h3 className="text-xl mb-6 text-foreground font-medium">
              Faça sua Avaliação Gratuita!
            </h3>
            <p className="mb-8 text-muted-foreground">
              Quer reduzir o valor das parcelas? Fazemos a avaliação gratuita do seu veículo atual e
              você pode usar como parte do pagamento. Avaliação rápida, justa e sem compromisso.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto h-14 text-lg px-8">
              <a
                href={getWhatsAppLink('Olá! Gostaria de avaliar meu carro para dar como entrada.')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Solicitar Avaliação Grátis pelo WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
