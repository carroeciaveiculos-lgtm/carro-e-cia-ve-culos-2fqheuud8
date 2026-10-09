import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, MessageCircle, Minus, Search } from 'lucide-react'
import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { anoFipeLegivel, nomeAnoFipe } from '@/lib/fipe-ref'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { trackCTAClick } from '@/lib/tracking'
import { useBrandConfig } from '@/hooks/use-brand-config'
import {
  getFipeAnos,
  getFipeMarcas,
  getFipeModelos,
  getFipePreco,
  getFipeReferencias,
  precoParaNumero,
  type FipeItem,
  type FipePreco,
  type FipeReferencia,
} from '@/services/fipe'

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const faqs = [
  {
    q: 'O que é a Tabela FIPE?',
    a: 'É uma pesquisa mensal de preços médios de veículos no Brasil, feita pela Fundação Instituto de Pesquisas Econômicas (FIPE). Ela serve de referência para comprar, vender, financiar e segurar um carro.',
  },
  {
    q: 'Com que frequência os valores mudam?',
    a: 'A FIPE publica uma tabela nova por mês. Esta página sempre abre no mês de referência mais recente disponível e mostra a data da consulta no resultado.',
  },
  {
    q: 'O valor FIPE é o preço pelo qual meu carro será vendido?',
    a: 'Não. É uma referência de mercado. O preço real depende de estado de conservação, quilometragem, opcionais, histórico e da procura na sua região. Por isso, o melhor caminho é pedir uma avaliação presencial.',
  },
  {
    q: 'Como a Carro e Cia Veículos pode ajudar a vender o meu carro?',
    a: 'Fazemos uma avaliação gratuita e oferecemos compra direta ou venda por consignação, com toda a parte de documentação e divulgação por nossa conta.',
  },
]

export default function TabelaFipe() {
  const { config } = useBrandConfig()

  const [refs, setRefs] = useState<FipeReferencia[]>([])
  const [marcas, setMarcas] = useState<FipeItem[]>([])
  const [modelos, setModelos] = useState<FipeItem[]>([])
  const [anos, setAnos] = useState<FipeItem[]>([])
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [filtroModelo, setFiltroModelo] = useState('')
  const [resultado, setResultado] = useState<FipePreco | null>(null)
  const [anterior, setAnterior] = useState<FipePreco | null>(null)
  const [carregando, setCarregando] = useState<'' | 'marcas' | 'modelos' | 'anos' | 'preco'>(
    'marcas',
  )
  const [erro, setErro] = useState('')

  const refAtual = refs[0]?.code ?? ''
  const refAnterior = refs[1]?.code ?? ''

  // 1) Mês de referência mais recente + marcas desse mês.
  useEffect(() => {
    let cancelado = false
    ;(async () => {
      const r = await getFipeReferencias()
      if (cancelado) return
      if (r.error || !r.data?.length) {
        setErro(r.error ?? 'Sem dados da Tabela FIPE no momento.')
        setCarregando('')
        return
      }
      setRefs(r.data)
      const m = await getFipeMarcas(r.data[0].code)
      if (cancelado) return
      if (m.error || !m.data) setErro(m.error ?? '')
      else setMarcas(m.data)
      setCarregando('')
    })()
    return () => {
      cancelado = true
    }
  }, [])

  const trocarMarca = async (valor: string) => {
    setMarca(valor)
    setModelo('')
    setAno('')
    setModelos([])
    setAnos([])
    setResultado(null)
    setFiltroModelo('')
    setErro('')
    setCarregando('modelos')
    const r = await getFipeModelos(valor, refAtual)
    if (r.error || !r.data) setErro(r.error ?? '')
    else setModelos(r.data)
    setCarregando('')
  }

  const trocarModelo = async (valor: string) => {
    setModelo(valor)
    setAno('')
    setAnos([])
    setResultado(null)
    setErro('')
    setCarregando('anos')
    const r = await getFipeAnos(marca, valor, refAtual)
    if (r.error || !r.data) setErro(r.error ?? '')
    else setAnos(r.data)
    setCarregando('')
  }

  const consultar = async (valor: string) => {
    setAno(valor)
    setResultado(null)
    setAnterior(null)
    setErro('')
    setCarregando('preco')
    const atual = await getFipePreco(marca, modelo, valor, refAtual)
    if (atual.error || !atual.data) {
      setErro(atual.error ?? '')
      setCarregando('')
      return
    }
    setResultado(atual.data)
    setCarregando('')
    // Variação contra o mês anterior: falha aqui não derruba o resultado.
    if (refAnterior) {
      const ant = await getFipePreco(marca, modelo, valor, refAnterior)
      if (ant.data) setAnterior(ant.data)
    }
  }

  const modelosFiltrados = useMemo(() => {
    const termo = filtroModelo.trim().toLowerCase()
    return termo ? modelos.filter((m) => m.name.toLowerCase().includes(termo)) : modelos
  }, [modelos, filtroModelo])

  const variacao = useMemo(() => {
    if (!resultado || !anterior) return null
    const a = precoParaNumero(resultado.price)
    const b = precoParaNumero(anterior.price)
    if (!a || !b) return null
    return { valor: a - b, pct: ((a - b) / b) * 100 }
  }, [resultado, anterior])

  const mensagemWhats = resultado
    ? `Olá! Consultei a Tabela FIPE no site: ${resultado.brand} ${resultado.model} ${anoFipeLegivel(resultado.modelYear)},${resultado.price} (${resultado.referenceMonth}). Gostaria de uma avaliação do meu carro.`
    : 'Olá! Gostaria de uma avaliação do meu carro.'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO
        title="Tabela FIPE: consulte o preço do seu carro | Carro e Cia Veículos"
        description="Consulte grátis o valor da Tabela FIPE de carros por marca, modelo e ano, com o mês de referência atualizado. Avalie o seu carro com a Carro e Cia Veículos, em Uberaba - MG."
        schema={schema}
        keywords="tabela fipe, consulta fipe, preço fipe carro, valor do meu carro, avaliação de carro Uberaba"
      />

      <section className="pt-28 pb-10 bg-slate-50 border-b">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Consulta Tabela FIPE
          </h1>
          <p className="text-slate-600">
            Descubra o valor de referência do seu carro. Escolha a marca, o modelo e o ano.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="rounded-xl border bg-white p-5 md:p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Marca</label>
              <Select value={marca} onValueChange={trocarMarca} disabled={carregando === 'marcas'}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carregando === 'marcas' ? 'Carregando marcas...' : 'Selecione a marca'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((m) => (
                    <SelectItem key={m.code} value={m.code}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Modelo</label>
              {modelos.length > 30 && (
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    placeholder="Digite para filtrar (ex.: Onix, Civic)"
                    value={filtroModelo}
                    onChange={(e) => setFiltroModelo(e.target.value)}
                  />
                </div>
              )}
              <Select value={modelo} onValueChange={trocarModelo} disabled={!modelos.length}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carregando === 'modelos' ? 'Carregando modelos...' : 'Selecione o modelo'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {modelosFiltrados.map((m) => (
                    <SelectItem key={m.code} value={m.code}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Ano</label>
              <Select value={ano} onValueChange={consultar} disabled={!anos.length}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={carregando === 'anos' ? 'Carregando anos...' : 'Selecione o ano'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a.code} value={a.code}>
                      {nomeAnoFipe(a.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {erro && (
              <Alert variant="destructive">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}
            {carregando === 'preco' && (
              <p className="text-sm text-slate-500">Consultando o valor...</p>
            )}
          </div>

          {resultado && (
            <div className="mt-6 rounded-xl border-2 border-primary/30 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Valor na Tabela FIPE</p>
              <p className="text-4xl font-bold text-slate-900 my-1">{resultado.price}</p>
              <p className="text-slate-700 font-medium">
                {resultado.brand} {resultado.model}
              </p>
              <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div>
                  <dt className="text-slate-500">Ano modelo</dt>
                  <dd className="font-medium">{anoFipeLegivel(resultado.modelYear)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Combustível</dt>
                  <dd className="font-medium">{resultado.fuel}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Código FIPE</dt>
                  <dd className="font-medium">{resultado.codeFipe}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Mês de referência</dt>
                  <dd className="font-medium first-letter:uppercase">{resultado.referenceMonth}</dd>
                </div>
              </dl>

              {variacao && anterior && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  {variacao.valor > 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  ) : variacao.valor < 0 ? (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-slate-500" />
                  )}
                  <span className="text-slate-700">
                    {variacao.valor === 0
                      ? 'Sem variação'
                      : `${variacao.valor > 0 ? '+' : '−'}${moeda(Math.abs(variacao.valor))} (${Math.abs(variacao.pct).toFixed(2).replace('.', ',')}%)`}{' '}
                    em relação a {anterior.referenceMonth} ({anterior.price})
                  </span>
                </div>
              )}

              <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                Valor de referência da Tabela FIPE, que não é preço de venda: o valor real depende
                de estado, quilometragem e procura. Fonte: Fundação FIPE.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Button asChild className="gap-2">
                  <a
                    href={getWhatsAppLink(mensagemWhats)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCTAClick('Avaliar meu carro (Tabela FIPE)')}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Quero uma avaliação gratuita
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/vender-meu-carro">Vender meu carro</Link>
                </Button>
              </div>
            </div>
          )}

          {erro && (
            <div className="mt-4 text-center">
              <Button asChild variant="outline" className="gap-2">
                <a
                  href={getWhatsAppLink('Olá! Preciso consultar o valor FIPE do meu carro.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar com a {config.name}
                </a>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Perguntas frequentes</h2>
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  )
}
