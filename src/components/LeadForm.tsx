import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getWhatsAppLink } from '@/lib/whatsapp'

const formSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório'),
  telefone: z.string().min(14, 'WhatsApp inválido'),
  marcaModelo: z.string().min(2, 'Marca e Modelo obrigatórios'),
  ano: z.string().min(4, 'Ano obrigatório'),
  km: z.string().optional(),
  mensagem: z.string().optional(),
  honeypot: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface LeadFormProps {
  tipo?: string
  buttonText?: string
  whatsappText?: string
}

export function LeadForm({
  tipo = 'venda',
  buttonText = 'Quero Vender Meu Carro Agora',
  whatsappText = 'Olá Luiz, quero vender meu carro!',
}: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', telefone: '', marcaModelo: '', ano: '', km: '', mensagem: '' },
  })

  const onSubmit = async (data: FormData) => {
    if (data.honeypot) return

    setIsSubmitting(true)
    try {
      const payload = {
        nome: data.nome,
        telefone: data.telefone,
        carro_modelo: data.marcaModelo,
        carro_ano: data.ano,
        carro_km: data.km,
        observacoes: data.mensagem,
        tipo,
        origem: window.location.pathname,
      }

      // Call edge function directly without needing RLS policies bypass from client side
      await supabase.functions.invoke('receive-leads', { body: payload })

      // Redirect to WhatsApp
      window.open(getWhatsAppLink(whatsappText), '_blank')
      form.reset()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2')
      value = value.replace(/(\d)(\d{4})$/, '$1-$2')
    }
    form.setValue('telefone', value, { shouldValidate: true })
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-xl"
      data-event="envio_formulario"
    >
      <div style={{ display: 'none' }} aria-hidden="true">
        <Input type="text" tabIndex={-1} autoComplete="off" {...form.register('honeypot')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo *</Label>
        <Input id="nome" placeholder="Seu nome" {...form.register('nome')} />
        {form.formState.errors.nome && (
          <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">WhatsApp *</Label>
        <Input
          id="telefone"
          placeholder="(34) 99999-9999"
          {...form.register('telefone')}
          onChange={(e) => {
            form.register('telefone').onChange(e)
            handlePhoneChange(e)
          }}
        />
        {form.formState.errors.telefone && (
          <p className="text-xs text-destructive">{form.formState.errors.telefone.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marcaModelo">Marca e Modelo *</Label>
          <Input id="marcaModelo" placeholder="Ex: Onix 1.0" {...form.register('marcaModelo')} />
          {form.formState.errors.marcaModelo && (
            <p className="text-xs text-destructive">{form.formState.errors.marcaModelo.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ano">Ano *</Label>
          <Input id="ano" placeholder="Ex: 2020" {...form.register('ano')} />
          {form.formState.errors.ano && (
            <p className="text-xs text-destructive">{form.formState.errors.ano.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="km">KM Aproximado</Label>
        <Input id="km" placeholder="Ex: 50000" {...form.register('km')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensagem">Mensagem (opcional)</Label>
        <Textarea
          id="mensagem"
          placeholder="Detalhes do veículo..."
          {...form.register('mensagem')}
          className="resize-none"
          rows={2}
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-lg font-bold bg-[#25D366] hover:bg-[#25D366]/90 text-white"
        disabled={isSubmitting}
        aria-label="Enviar solicitação de avaliação gratuita"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" /> {buttonText}
          </>
        )}
      </Button>
    </form>
  )
}
