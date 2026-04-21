import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function LeadForm({
  tipo = 'consignacao',
  campanha = 'consignacao',
  buttonText = 'Enviar',
  origem = 'Site',
  whatsappText,
}: {
  tipo?: string
  campanha?: string
  buttonText?: string
  whatsappText?: string
  origem?: string
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
          campanha: campanha || tipo,
          origem: origem || `Página - ${window.location.pathname}`,
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
        description:
          'Ocorreu um erro ao processar sua solicitação. Tente novamente ou chame no WhatsApp.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-card p-6 rounded-xl border shadow-sm w-full text-left box-border overflow-hidden"
    >
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo *</Label>
        <Input
          id="nome"
          required
          value={formData.nome}
          onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
          placeholder="Seu nome"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="seu.email@exemplo.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp *</Label>
        <Input
          id="whatsapp"
          required
          value={formData.whatsapp}
          onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
          placeholder="(34) 99999-9999"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="modelo_veiculo">Qual veículo quer vender?</Label>
        <Input
          id="modelo_veiculo"
          value={formData.modelo_veiculo}
          onChange={(e) => setFormData((prev) => ({ ...prev, modelo_veiculo: e.target.value }))}
          placeholder="Ex: Corolla 2020"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-sm md:text-lg font-bold mt-2 whitespace-normal break-words leading-snug"
        disabled={loading}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
        {buttonText}
      </Button>
    </form>
  )
}
