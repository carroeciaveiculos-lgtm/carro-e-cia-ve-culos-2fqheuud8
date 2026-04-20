import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackConversion } from '@/lib/tracking'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

interface ConsignacaoLPFormProps {
  origem: string
  title: string
  subtitle: string
}

export function ConsignacaoLPForm({ origem, title, subtitle }: ConsignacaoLPFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    carro_modelo: '',
    carro_ano: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('leads').insert({
        nome: formData.nome,
        telefone: formData.telefone,
        carro_modelo: formData.carro_modelo,
        carro_ano: formData.carro_ano,
        tipo: 'vendedor',
        origem,
        status: 'novo',
        temperatura: 'quente',
      })

      if (error) throw error

      trackConversion('formulario')

      toast({
        title: 'Dados enviados com sucesso!',
        description: 'Nossa equipe entrará em contato em breve.',
      })

      setFormData({ nome: '', telefone: '', carro_modelo: '', carro_ano: '' })
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="modelo">Modelo do Veículo</Label>
          <Input
            id="modelo"
            required
            value={formData.carro_modelo}
            onChange={(e) => setFormData({ ...formData, carro_modelo: e.target.value })}
            placeholder="Ex: Corolla"
          />
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="ano">Ano</Label>
          <Input
            id="ano"
            required
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
        {loading ? 'Enviando...' : 'QUERO UMA AVALIAÇÃO GRÁTIS'}
      </Button>
    </form>
  )
}
