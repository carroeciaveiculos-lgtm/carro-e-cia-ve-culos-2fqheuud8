import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Send } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface ConsignacaoLPFormProps {
  title?: string
  subtitle?: string
  origem: string
}

export function ConsignacaoLPForm({
  title = 'Venda seu carro hoje, sem golpes e sem curiosos na sua porta.',
  subtitle = 'A Carro e Cia tem os compradores certos. Preencha agora e receba a melhor proposta de consignação de Uberaba em 15 minutos.',
  origem,
}: ConsignacaoLPFormProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    carro_marca: '',
    carro_modelo: '',
    carro_ano: '',
    carro_km: '',
    valor_veiculo: '',
    carro_placa: '',
    unico_dono: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (honeypot) {
      navigate('/obrigado')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.functions.invoke('receive-leads', {
        body: {
          ...formData,
          origem,
          tipo: 'vendedor',
        },
      })

      if (error) throw error

      navigate('/obrigado')
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar. Tente novamente.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <div className="bg-card p-8 rounded-xl shadow-xl border border-border">
      <h3 className="font-display font-bold text-2xl mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-6 text-sm">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-4" data-event="consignacao">
        <div style={{ display: 'none' }} aria-hidden="true">
          <Input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome Completo</Label>
          <Input
            required
            id="nome"
            placeholder="Seu nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              required
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">WhatsApp</Label>
            <Input
              required
              id="telefone"
              type="tel"
              placeholder="(34) 99999-9999"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="carro_marca">Marca</Label>
            <Input
              required
              id="carro_marca"
              placeholder="Ex: Toyota"
              value={formData.carro_marca}
              onChange={(e) => setFormData({ ...formData, carro_marca: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carro_modelo">Modelo</Label>
            <Input
              required
              id="carro_modelo"
              placeholder="Ex: Corolla XEI"
              value={formData.carro_modelo}
              onChange={(e) => setFormData({ ...formData, carro_modelo: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="carro_ano">Ano</Label>
            <Input
              required
              id="carro_ano"
              placeholder="Ex: 2020"
              value={formData.carro_ano}
              onChange={(e) => setFormData({ ...formData, carro_ano: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carro_km">KM Aproximado</Label>
            <Input
              required
              id="carro_km"
              placeholder="Ex: 45000"
              value={formData.carro_km}
              onChange={(e) => setFormData({ ...formData, carro_km: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valor_veiculo">Valor Desejado (R$)</Label>
            <Input
              required
              id="valor_veiculo"
              placeholder="Ex: 120000"
              value={formData.valor_veiculo}
              onChange={(e) => setFormData({ ...formData, valor_veiculo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carro_placa">Placa</Label>
            <Input
              required
              id="carro_placa"
              placeholder="ABC1D23"
              value={formData.carro_placa}
              onChange={(e) => setFormData({ ...formData, carro_placa: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="unico_dono"
            checked={formData.unico_dono}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, unico_dono: checked === true })
            }
          />
          <Label htmlFor="unico_dono" className="font-medium cursor-pointer">
            Único Dono?
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#C0392B] hover:bg-[#a12f23] mt-4 h-14 text-sm md:text-lg font-bold text-white uppercase tracking-wide shadow-lg whitespace-normal h-auto py-3"
          disabled={loading}
        >
          {loading ? (
            'Enviando...'
          ) : (
            <>
              <Send className="w-5 h-5 mr-2 shrink-0" /> QUERO VENDER MEU CARRO COM SEGURANÇA
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
