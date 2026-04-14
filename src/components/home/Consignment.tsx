import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhoneCall, Search, FileText, Share2, DollarSign, AlertTriangle } from 'lucide-react'
import { getMarcas, getModelos, getAnos } from '@/services/fipe'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function Consignment() {
  const [marcas, setMarcas] = useState<any[]>([])
  const [modelos, setModelos] = useState<any[]>([])
  const [anos, setAnos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    marca: '',
    modelo: '',
    ano: '',
    km: '',
    valor: '',
    origem: '',
  })

  useEffect(() => {
    getMarcas().then(setMarcas).catch(console.error)
  }, [])

  const handleMarcaChange = (val: string) => {
    setFormData({ ...formData, marca: val, modelo: '', ano: '' })
    const marca = marcas.find((m) => m.nome === val)
    if (marca) getModelos(marca.codigo).then(setModelos).catch(console.error)
  }

  const handleModeloChange = (val: string) => {
    setFormData({ ...formData, modelo: val, ano: '' })
    const marca = marcas.find((m) => m.nome === formData.marca)
    const modelo = modelos.find((m) => m.nome === val)
    if (marca && modelo) getAnos(marca.codigo, modelo.codigo).then(setAnos).catch(console.error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const veiculoInteresse = `${formData.marca} ${formData.modelo} ${formData.ano} - KM: ${formData.km}`
      const { error } = await supabase.from('leads').insert([
        {
          nome: formData.nome,
          telefone: formData.telefone,
          tipo: 'consignacao',
          origem: formData.origem || 'site',
          veiculo_interesse: veiculoInteresse,
          faixa_preco: formData.valor,
          status: 'novo',
        },
      ])

      if (error) throw error

      await supabase.functions.invoke('send-lead-email', {
        body: {
          nome: formData.nome,
          telefone: formData.telefone,
          email: 'Nao informado',
          veiculo: veiculoInteresse,
          mensagem: `Valor desejado: R$ ${formData.valor || 'Nao informado'}`,
          origem: 'Site - Consignação',
        },
      })

      toast({
        title: 'Solicitação Enviada!',
        description: 'Recebemos sua solicitação. Em breve entraremos em contato.',
      })
      setFormData({
        nome: '',
        telefone: '',
        marca: '',
        modelo: '',
        ano: '',
        km: '',
        valor: '',
        origem: '',
      })

      const text = encodeURIComponent(
        `Olá! Tenho um ${formData.marca} ${formData.modelo} ${formData.ano} com ${formData.km} km para consignar. Podemos conversar?`,
      )
      window.open(`https://wa.me/5534999484285?text=${text}`, '_blank')
    } catch (err) {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua solicitação. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="py-20 bg-muted/50" id="consignacao">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Como Funciona o Serviço de Consignação?
            </h2>
            <p className="text-lg text-muted-foreground">
              Venda seu veículo de forma rápida, segura e pelo melhor preço do mercado sem se
              preocupar com a burocracia.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-8 md:gap-4 relative">
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-[2px] bg-border z-0" />
            {[
              { icon: PhoneCall, t: 'Contato', d: 'Você entra em contato com a loja' },
              { icon: Search, t: 'Avaliação', d: 'Avaliamos seu veículo na hora' },
              { icon: FileText, t: 'Contrato', d: 'Assinamos um contrato seguro' },
              { icon: Share2, t: 'Divulgação', d: 'Anunciamos em todos os portais' },
              { icon: DollarSign, t: 'Venda', d: 'Vendemos e repassamos o valor' },
            ].map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-background border-[3px] border-primary rounded-full flex items-center justify-center mb-4 shadow-md text-primary">
                  <s.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold mb-2">{s.t}</h4>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-white">
              Quer Vender seu Carro Sem Dor de Cabeça?
            </h2>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              Deixa com a gente. Cuidamos de tudo — da avaliação, documentação, até a entrega do
              dinheiro na sua conta.
            </p>

            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="text-accent" /> 5 Riscos de Vender Sozinho
            </h3>
            <ul className="space-y-4 mb-8">
              {[
                'Aceitar cheque sem fundo ou PIX fraudulento',
                'Comprar um carro roubado sem saber',
                'Transferência não realizada e multas acumulando',
                'Golpes com documentos falsos',
                'Meses perdidos sem vender, depreciando o veículo',
              ].map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
            <p className="text-xl font-medium text-accent">
              Na Carro e Cia, você entrega a chave, e a gente resolve o resto.
            </p>
          </div>

          <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-2xl text-foreground border border-border/50">
            <h3 className="text-2xl font-display font-bold mb-6">
              Solicite uma Avaliação Gratuita
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  placeholder="Nome completo *"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="h-12"
                />
                <Input
                  placeholder="WhatsApp *"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <Select value={formData.marca} onValueChange={handleMarcaChange} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Marca *" />
                  </SelectTrigger>
                  <SelectContent>
                    {marcas.map((m) => (
                      <SelectItem key={m.codigo} value={m.nome}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.modelo}
                  onValueChange={handleModeloChange}
                  disabled={!formData.marca}
                  required
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Modelo *" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelos.map((m) => (
                      <SelectItem key={m.codigo} value={m.nome}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <Select
                  value={formData.ano}
                  onValueChange={(v) => setFormData({ ...formData, ano: v })}
                  disabled={!formData.modelo}
                  required
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Ano *" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((a) => (
                      <SelectItem key={a.codigo} value={a.nome}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="KM aproximado *"
                  required
                  value={formData.km}
                  onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  placeholder="Valor desejado (R$)"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="h-12"
                />
                <Select
                  value={formData.origem}
                  onValueChange={(v) => setFormData({ ...formData, origem: v })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Como nos conheceu?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={loading}>
                {loading ? 'Enviando Dados...' : 'Quero Consignar Agora'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
