import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { trackFormSubmission } from '@/lib/tracking'

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
    ano_veiculo: '',
    km: '',
    condicao: '',
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

      trackFormSubmission(formData.modelo_veiculo || 'N/A', campanha || tipo)
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
      className="space-y-4 bg-card p-5 md:p-6 rounded-xl border shadow-sm w-full text-left box-border overflow-hidden"
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
        <Label htmlFor="modelo_veiculo">Qual veículo quer vender? *</Label>
        <Input
          id="modelo_veiculo"
          required
          value={formData.modelo_veiculo}
          onChange={(e) => setFormData((prev) => ({ ...prev, modelo_veiculo: e.target.value }))}
          placeholder="Ex: Chevrolet Onix 2022"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ano_veiculo">Ano do Veículo *</Label>
        <select
          id="ano_veiculo"
          required
          value={formData.ano_veiculo}
          onChange={(e) => setFormData((prev) => ({ ...prev, ano_veiculo: e.target.value }))}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecione o ano</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
          <option value="2020">2020</option>
          <option value="2019">2019</option>
          <option value="2018">2018</option>
          <option value="2017">2017</option>
          <option value="2016">2016</option>
          <option value="2015">2015</option>
          <option value="Anterior">Anterior a 2015</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="km">Quilometragem *</Label>
        <Input
          id="km"
          type="number"
          required
          value={formData.km}
          onChange={(e) => setFormData((prev) => ({ ...prev, km: e.target.value }))}
          placeholder="Ex: 45000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="condicao">Condição do Veículo *</Label>
        <select
          id="condicao"
          required
          value={formData.condicao}
          onChange={(e) => setFormData((prev) => ({ ...prev, condicao: e.target.value }))}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecione</option>
          <option value="excelente">Excelente (sem problemas)</option>
          <option value="bom">Bom (pequenos detalhes)</option>
          <option value="regular">Regular (necessita reparos)</option>
        </select>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-sm md:text-lg font-bold mt-2 whitespace-normal break-words leading-snug btn-cta"
        disabled={loading}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
        {buttonText}
      </Button>
    </form>
  )
}
