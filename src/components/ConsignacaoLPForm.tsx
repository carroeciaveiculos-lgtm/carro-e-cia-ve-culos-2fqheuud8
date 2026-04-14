import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Send } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface ConsignacaoLPFormProps {
  title?: string
  subtitle?: string
  origem: string
}

export function ConsignacaoLPForm({
  title = 'Solicite uma Avaliação',
  subtitle = 'Preencha os dados e entraremos em contato.',
  origem,
}: ConsignacaoLPFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    carro_modelo: '',
    carro_ano: '',
    carro_placa: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      toast({
        title: 'Sucesso!',
        description: 'Seus dados foram enviados com sucesso.',
      })
      setFormData({ nome: '', telefone: '', carro_modelo: '', carro_ano: '', carro_placa: '' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card p-8 rounded-xl shadow-xl border border-border">
      <h3 className="font-display font-bold text-2xl mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-6 text-sm">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="space-y-2">
          <Label htmlFor="carro_modelo">Modelo do Carro</Label>
          <Input
            required
            id="carro_modelo"
            placeholder="Ex: Corolla XEI 2.0"
            value={formData.carro_modelo}
            onChange={(e) => setFormData({ ...formData, carro_modelo: e.target.value })}
          />
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
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 mt-4 h-12 text-lg"
          disabled={loading}
        >
          {loading ? (
            'Enviando...'
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" /> Avaliar Meu Carro
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
