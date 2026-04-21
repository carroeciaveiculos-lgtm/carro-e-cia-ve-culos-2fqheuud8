import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function ConsignacaoLPForm({
  title = 'Solicite uma avaliação',
  subtitle = 'Nossa equipe entrará em contato rapidamente.',
  campanha = 'consignacao',
  origem = 'LP',
  whatsappText,
}: {
  title?: string
  subtitle?: string
  campanha?: string
  origem?: string
  whatsappText?: string
}) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    modelo_veiculo: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const urlParams = new URLSearchParams(window.location.search)

      const { error } = await supabase.functions.invoke('lead-automation', {
        body: {
          ...formData,
          campanha,
          origem,
          utm_source: urlParams.get('utm_source'),
          utm_medium: urlParams.get('utm_medium'),
          utm_campaign: urlParams.get('utm_campaign'),
        },
      })

      if (error) throw error

      navigate('/obrigado', { state: { nome: formData.nome } })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao enviar',
        description: 'Ocorreu um erro ao enviar seus dados. Tente novamente ou chame no WhatsApp.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-left">
      <div className="text-center">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 w-full box-border overflow-hidden">
        <div className="space-y-2">
          <Label htmlFor="nome_lp">Nome Completo *</Label>
          <Input
            id="nome_lp"
            required
            value={formData.nome}
            onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
            placeholder="Seu nome"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_lp">E-mail</Label>
          <Input
            id="email_lp"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="seu.email@exemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp_lp">WhatsApp *</Label>
          <Input
            id="whatsapp_lp"
            required
            value={formData.whatsapp}
            onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
            placeholder="(34) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo_veiculo_lp">Veículo *</Label>
          <Input
            id="modelo_veiculo_lp"
            required
            value={formData.modelo_veiculo}
            onChange={(e) => setFormData((prev) => ({ ...prev, modelo_veiculo: e.target.value }))}
            placeholder="Ex: Honda Civic 2021"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-14 text-sm md:text-lg font-bold mt-4 whitespace-normal break-words leading-snug"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          AVALIAR MEU CARRO
        </Button>
      </form>
    </div>
  )
}
