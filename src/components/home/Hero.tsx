import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ShieldCheck, Megaphone, Clock, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createLead } from '@/services/leads'

const formSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(14, 'WhatsApp inválido'),
  busca: z.string().min(1, 'Selecione uma opção'),
  honeypot: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function Hero() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', email: '', telefone: '', busca: '' },
  })

  const onSubmit = async (data: FormData) => {
    if (data.honeypot) {
      toast({
        title: 'Sucesso!',
        description: 'Recebemos sua solicitação! Em breve entraremos em contato via WhatsApp.',
      })
      form.reset()
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await createLead({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        tipo: 'contato',
        origem: 'homepage_formulario',
        observacoes: `Interesse: ${data.busca}`,
      })

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: 'Recebemos sua solicitação! Em breve entraremos em contato via WhatsApp.',
      })
      form.reset()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar sua solicitação. Tente novamente.',
      })
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

  const { onChange: onPhoneChange, ...phoneRest } = form.register('telefone')

  return (
    <>
      <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg"
            alt="Fachada Carro e Cia Veículos Uberaba MG"
            width="1920"
            height="1080"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 z-0 bg-black/50" />

        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Você tem um carro para vender. <br className="hidden lg:block" />
              <span className="text-primary">Nós temos os compradores esperando.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-2xl mx-auto lg:mx-0 drop-shadow-md">
              Consignação segura, rápida e transparente em Uberaba há mais de 20 anos.
            </p>
          </div>

          <div className="bg-background rounded-xl p-6 sm:p-8 shadow-2xl w-full max-w-md mx-auto lg:ml-auto border border-border/50 animate-fade-in-up box-border overflow-hidden">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div style={{ display: 'none' }} aria-hidden="true">
                <Input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...form.register('honeypot')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input id="nome" placeholder="Seu nome" {...form.register('nome')} />
                {form.formState.errors.nome && (
                  <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">WhatsApp *</Label>
                <Input
                  id="telefone"
                  placeholder="(34) 99999-9999"
                  {...phoneRest}
                  onChange={(e) => {
                    onPhoneChange(e)
                    handlePhoneChange(e)
                  }}
                />
                {form.formState.errors.telefone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.telefone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="busca">O que você busca? *</Label>
                <Select
                  onValueChange={(val) => form.setValue('busca', val, { shouldValidate: true })}
                >
                  <SelectTrigger
                    id="busca"
                    className={form.formState.errors.busca ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quero deixar meu veículo para vender">
                      Quero deixar meu veículo para vender
                    </SelectItem>
                    <SelectItem value="Quero comprar um veículo">
                      Quero comprar um veículo
                    </SelectItem>
                    <SelectItem value="Quero financiar um veículo">
                      Quero financiar um veículo
                    </SelectItem>
                    <SelectItem value="Quero fazer um seguro para meu veículo">
                      Quero fazer um seguro para meu veículo
                    </SelectItem>
                    <SelectItem value="Quero comprar um consórcio de veículo">
                      Quero comprar um consórcio de veículo
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.busca && (
                  <p className="text-xs text-destructive">{form.formState.errors.busca.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-[#25D366] hover:bg-[#25D366]/90 text-white transition-colors duration-300 mt-2"
                disabled={isSubmitting}
                aria-label="Enviar solicitação de contato"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" /> Solicite Agora
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background relative z-20 -mt-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Segurança Garantida',
                desc: 'Vendas com contrato e total transparência',
              },
              {
                icon: Megaphone,
                title: 'Divulgação Completa',
                desc: 'Anunciamos em OLX, WebMotors, iCarros e Mercado Livre',
              },
              {
                icon: Clock,
                title: '+20 Anos de Experiência',
                desc: 'Referência em qualidade e procedência em Uberaba',
              },
            ].map((b, i) => (
              <div
                key={i}
                className="bg-card p-8 rounded-xl shadow-lg border border-border/50 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                  <b.icon className="w-8 h-8" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-display font-bold mb-3">{b.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
