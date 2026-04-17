import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Send } from 'lucide-react'
import { createLead } from '@/services/leads'

interface LeadFormProps {
  title?: string
  subtitle?: string
  origem?: string
  veiculoInteresse?: string
}

export function LeadForm({
  title = 'Preencha seus dados',
  subtitle = 'Nossa equipe entrará em contato em até 15 minutos.',
  origem = 'Site - Contato',
  veiculoInteresse = '',
}: LeadFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    veiculo_interesse: veiculoInteresse,
    observacoes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await createLead({
      ...formData,
      tipo: origem.includes('Consignação') ? 'vendedor' : 'comprador',
      origem,
      status: 'novo',
    })

    setLoading(false)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso!',
        description: 'Seus dados foram enviados. Aguarde nosso contato.',
      })
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        veiculo_interesse: veiculoInteresse,
        observacoes: '',
      })
    }
  }

  return (
    <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
      <h3 className="font-display font-bold text-2xl mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-6 text-sm">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-4" data-event="lead">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            required
            placeholder="Digite seu nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">WhatsApp</Label>
          <Input
            id="phone"
            required
            placeholder="(34) 99999-9999"
            type="tel"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle">Veículo (Opcional)</Label>
          <Input
            id="vehicle"
            placeholder="Ex: Compass 2022"
            value={formData.veiculo_interesse}
            onChange={(e) => setFormData({ ...formData, veiculo_interesse: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem (Opcional)</Label>
          <Textarea
            id="message"
            placeholder="Como podemos ajudar?"
            className="resize-none"
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
          {loading ? (
            'Enviando...'
          ) : (
            <>
              Enviar Solicitação <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
