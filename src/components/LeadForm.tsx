import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Send } from 'lucide-react'

export function LeadForm({
  title = 'Preencha seus dados',
  subtitle = 'Nossa equipe entrará em contato em até 15 minutos.',
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast({
        title: 'Sucesso!',
        description: 'Seus dados foram enviados. Aguarde nosso contato.',
      })
      ;(e.target as HTMLFormElement).reset()
    }, 1000)
  }

  return (
    <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
      <h3 className="font-display font-bold text-2xl mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-6 text-sm">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" required placeholder="Digite seu nome" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">WhatsApp</Label>
          <Input id="phone" required placeholder="(34) 99999-9999" type="tel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle">Veículo (Opcional)</Label>
          <Input id="vehicle" placeholder="Ex: Compass 2022" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem (Opcional)</Label>
          <Textarea id="message" placeholder="Como podemos ajudar?" className="resize-none" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
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
