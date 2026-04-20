import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackConversion, trackGTMEvent } from '@/lib/tracking'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { getWhatsAppLink } from '@/lib/whatsapp'

interface ConsignacaoLPFormProps {
  origem: string
  title: string
  subtitle: string
  campanha: string
  whatsappText: string
}

export function ConsignacaoLPForm({
  origem,
  title,
  subtitle,
  campanha,
  whatsappText,
}: ConsignacaoLPFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    carro_modelo: '',
    carro_ano: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('lead-automation', {
        body: {
          nome: formData.nome,
          email: formData.email,
          whatsapp: formData.telefone,
          modelo_veiculo: formData.carro_modelo,
          ano_veiculo: formData.carro_ano,
          campanha,
          origem,
        },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      trackConversion('formulario')
      trackGTMEvent(`submit_form_${campanha}`, {
        campaign: campanha,
        email: formData.email,
        lead_id: data?.lead_id,
      })

      toast({
        title: 'Dados enviados com sucesso!',
        description: 'Você será redirecionado para o WhatsApp em instantes.',
      })

      setFormData({ nome: '', telefone: '', email: '', carro_modelo: '', carro_ano: '' })

      setTimeout(() => {
        window.location.href = getWhatsAppLink(whatsappText)
      }, 1500)
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao enviar dados',
        description: 'Tente novamente ou nos chame diretamente no WhatsApp.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card p-6 md:p-8 rounded-2xl shadow-xl border space-y-4"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>

      <div className="space-y-2 text-left">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input
          id="nome"
          required
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Seu nome"
        />
      </div>

      <div className="space-y-2 text-left">
        <Label htmlFor="telefone">WhatsApp</Label>
        <Input
          id="telefone"
          required
          value={formData.telefone}
          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          placeholder="(34) 99999-9999"
        />
      </div>

      <div className="space-y-2 text-left">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="seu@email.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="modelo">
            Modelo do Veículo{' '}
            <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
          </Label>
          <Input
            id="modelo"
            value={formData.carro_modelo}
            onChange={(e) => setFormData({ ...formData, carro_modelo: e.target.value })}
            placeholder="Ex: Corolla"
          />
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="ano">
            Ano <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
          </Label>
          <Input
            id="ano"
            value={formData.carro_ano}
            onChange={(e) => setFormData({ ...formData, carro_ano: e.target.value })}
            placeholder="Ex: 2020"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-lg font-bold bg-red-600 hover:bg-red-700 text-white mt-4"
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'QUERO UMA AVALIAÇÃO'}
      </Button>
    </form>
  )
}
