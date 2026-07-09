import { useState, useEffect } from 'react'
import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { trackConversion, trackSimulation } from '@/lib/tracking'
import { supabase } from '@/lib/supabase/client'
import { handleCommercialCTA } from '@/lib/cta-router'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function FinanciamentoAuto() {
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [selectedVeiculo, setSelectedVeiculo] = useState<any>(null)
  const [entrada, setEntrada] = useState('')
  const [parcelas, setParcelas] = useState('48')

  useEffect(() => {
    supabase
      .from('veiculos')
      .select('id, marca, modelo, preco_venda')
      .eq('status', 'disponivel')
      .limit(100)
      .then(({ data }) => {
        if (data) setVeiculos(data)
      })
  }, [])

  const precoBase = selectedVeiculo ? selectedVeiculo.preco_venda : 50000
  const valorFinanciado = precoBase - (parseFloat(entrada) || 0)
  const parcelaEstimada = valorFinanciado > 0 ? (valorFinanciado * 1.5) / parseInt(parcelas) : 0

  const handleSimular = async () => {
    trackConversion('whatsapp')
    if (selectedVeiculo) {
      await supabase.from('simulacoes').insert({
        veiculo_id: selectedVeiculo.id,
        valor_carro: precoBase,
        entrada_percentual: ((parseFloat(entrada) || 0) / precoBase) * 100,
        prazo_meses: parseInt(parcelas),
        status: 'Pendente',
      })
      trackSimulation(precoBase, ((parseFloat(entrada) || 0) / precoBase) * 100, parcelas)
    }

    await handleCommercialCTA({
      vehicle: selectedVeiculo,
      ctaType: 'Simular Financiamento',
      source: window.location.pathname,
      isSimulacao: true,
      simDetails: { entrada, parcelas },
    })
  }

  const passos = [
    {
      n: '1',
      title: 'ANÁLISE DE CRÉDITO',
      desc: 'Avaliamos seu perfil em minutos de forma segura.',
    },
    {
      n: '2',
      title: 'APROVAÇÃO RÁPIDA',
      desc: 'Resposta rápida (até 24 horas) para sua análise.',
    },
    { n: '3', title: 'DOCUMENTAÇÃO', desc: 'Preparamos toda a documentação necessária.' },
    { n: '4', title: 'CHAVE NA MÃO', desc: 'Você recebe as chaves do seu carro novo.' },
  ]

  const parceiros = [
    'Banco Safra',
    'Bradesco',
    'C6 Financeira',
    'Santander',
    'BV Financeira',
    'Caixa Econômica',
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Financiamento de Carros em Uberaba | Até 60x"
        description="Financiamento flexível de carros em Uberaba. Parcelamento até 60 meses com as melhores taxas. Consulte agora na Carro e Cia."
      />

      <section className="bg-red-600 text-white py-20 px-4 text-center">
        <div className="container max-w-4xl mx-auto mt-10">
          <div className="inline-block bg-black text-white px-4 py-2 rounded-full font-bold text-sm mb-6 uppercase">
            Parcelamento Flexível em até 60 meses
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Financiamento de Carros em Uberaba — Até 60x
          </h1>
          <p className="text-xl text-red-100 mb-10 max-w-2xl mx-auto">
            O financiamento de carros é a forma mais acessível de adquirir um veículo novo ou
            seminovo. Na Carro e Cia Veículos, oferecemos soluções financeiras personalizadas para
            cada cliente.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 h-auto bg-black hover:bg-gray-900 text-white w-full sm:w-auto rounded-full font-bold btn-cta"
            onClick={() => {
              const el = document.getElementById('simulador')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            QUERO FINANCIAR MEU CARRO
          </Button>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto prose prose-lg dark:prose-invert">
          <h2 className="text-center mb-8">Por Que Financiar um Carro?</h2>
          <p className="text-center mb-12">
            Financiar um carro permite que você adquira um veículo sem desembolsar todo o valor à
            vista. É a forma mais inteligente de se mover sem comprometer seu orçamento.
          </p>

          <div className="bg-muted/30 border rounded-2xl p-8 my-8 shadow-sm not-prose">
            <h3 className="text-2xl font-bold mb-6">Benefícios do Financiamento:</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Parcelamento flexível em
                até 60 meses
              </li>
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Taxas competitivas e
                parceiros de confiança
              </li>
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Análise rápida e aprovação
                em até 24 horas
              </li>
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Sem necessidade de entrada
                alta
              </li>
              <li className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-xl">✓</span> Flexibilidade para
                escolher o veículo dos sonhos
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 px-4 border-y">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Processo de Aprovação Rápido</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {passos.map((p) => (
              <div
                key={p.n}
                className="bg-background border rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {p.n}
                </div>
                <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-muted-foreground text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div id="simulador" className="bg-white border rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Simulador Online Integrado ao Estoque</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold block mb-1">Escolha o Veículo</label>
                  <Select
                    onValueChange={(val) => setSelectedVeiculo(veiculos.find((v) => v.id === val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um veículo do estoque" />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculos.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.marca} {v.modelo} - R$ {v.preco_venda?.toLocaleString('pt-BR')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Valor da Entrada (R$)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 20000"
                    value={entrada}
                    onChange={(e) => setEntrada(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Parcelas</label>
                  <Select value={parcelas} onValueChange={setParcelas}>
                    <SelectTrigger>
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

              <div className="bg-red-50 p-6 rounded-xl border border-red-100 mt-6 text-center">
                <p className="text-sm text-red-800 mb-1">Resultado estimado da parcela:</p>
                <p className="text-3xl font-extrabold text-red-600">
                  {parcelas}x de{' '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    parcelaEstimada,
                  )}
                </p>
                <p className="text-xs text-red-700/60 mt-2">
                  * Valores aproximados sujeitos a análise de crédito.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full mt-4 bg-red-600 hover:bg-red-700"
                onClick={handleSimular}
              >
                ENVIAR SIMULAÇÃO PELO WHATSAPP
              </Button>
            </div>

            <div className="prose prose-lg dark:prose-invert">
              <h2>Documentação Necessária</h2>
              <p>Para solicitar o financiamento, separe os seguintes documentos básicos:</p>
              <ul>
                <li>RG e CPF (ou CNH)</li>
                <li>Comprovante de Renda atualizado</li>
                <li>Comprovante de Residência</li>
                <li>Referências bancárias (se necessário)</li>
              </ul>

              <h3 className="mt-8">Dúvidas Frequentes</h3>
              <p>
                <strong>Preciso de entrada?</strong> Não é obrigatório, mas uma entrada reduz muito
                o valor das suas parcelas e facilita a aprovação.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 px-4 border-t">
        <div className="container max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Nossos Parceiros Financeiros</h2>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            {parceiros.map((parceiro) => (
              <div
                key={parceiro}
                className="bg-background border rounded-xl px-6 py-4 shadow-sm font-bold text-gray-700 dark:text-gray-300 min-w-[180px]"
              >
                {parceiro}
              </div>
            ))}
          </div>

          <div className="mt-16 bg-red-600 text-white rounded-3xl p-10 max-w-3xl mx-auto shadow-xl">
            <h2 className="text-3xl font-bold mb-4">Pronto para Conquistar Seu Carro?</h2>
            <p className="mb-8 text-red-100 text-lg">
              Faça sua simulação gratuita agora mesmo e descubra as melhores condições.
            </p>
            <Button
              size="lg"
              className="text-lg px-10 py-6 h-auto bg-white hover:bg-gray-100 text-red-600 w-full sm:w-auto rounded-full font-bold btn-cta"
              onClick={() => {
                const el = document.getElementById('simulador')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              SIMULAR MEU FINANCIAMENTO AGORA
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
