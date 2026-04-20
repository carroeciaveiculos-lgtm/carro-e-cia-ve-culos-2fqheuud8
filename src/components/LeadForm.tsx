import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackConversion } from '@/lib/tracking'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

interface LeadFormProps {
  tipo: string
  buttonText: string
  whatsappText: string
}

export function LeadForm({ tipo, buttonText, whatsappText }: LeadFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('leads').insert({
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        tipo: 'vendedor',
        origem: `Site - ${tipo}`,
        status: 'novo',
        temperatura: 'quente',
      })

      if (error) throw error

      trackConversion('formulario')

      toast({
        title: 'Dados enviados com sucesso!',
        description: 'Nossa equipe entrará em contato em breve.',
      })

      setFormData({ nome: '', telefone: '', email: '' })
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar dados',
        description: 'Tente novamente ou nos chame no WhatsApp.',
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
      <div>
        <h3 className="text-2xl font-bold mb-2">Solicite uma avaliação</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Preencha os dados e entraremos em contato rapidamente.
        </p>
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

      <Button
        type="submit"
        className="w-full h-12 text-lg font-bold bg-red-600 hover:bg-red-700 text-white"
        disabled={loading}
      >
        {loading ? 'Enviando...' : buttonText}
      </Button>
    </form>
  )
}
