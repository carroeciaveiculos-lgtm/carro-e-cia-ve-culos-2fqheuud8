import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ShieldCheck, Megaphone, Clock, Send, Loader2, ChevronDown } from 'lucide-react'
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
import { trackFormSubmission } from '@/lib/tracking'

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

      trackFormSubmission(data.busca, 'contato_homepage')

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
      <section className="relative min-h-[100dvh] pt-28 pb-32 lg:pt-32 lg:pb-48 overflow-hidden flex items-center bg-[#1a1a1a]">
        <div className="absolute inset-0 z-0 w-full h-full bg-[#1a1a1a] bg-gradient-to-b from-[#2a2a2a] to-[#111111]">
          <picture className="w-full h-full block">
            <source
              media="(max-width: 768px)"
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-mobile.webp"
              type="image/webp"
            />
            <source
              srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
              type="image/webp"
            />
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp"
              alt="Fachada da loja Carro e Cia em Uberaba - MG, localizada em avenida estratégica com múltiplos veículos de qualidade"
              width="1920"
              height="1080"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
          </picture>
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/50 to-black/70" />

        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start mt-8 lg:mt-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Você tem um carro para vender. <br className="hidden lg:block" />
              <span className="text-primary">Nós temos os compradores esperando.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-2xl mx-auto lg:mx-0 drop-shadow-md">
              Consignação segura, rápida e transparente em Uberaba há mais de 20 anos.
            </p>
          </div>

          <div className="bg-background rounded-xl p-5 sm:p-8 shadow-2xl w-full max-w-full sm:max-w-md mx-auto lg:ml-auto border border-border/50 animate-fade-in-up box-border overflow-hidden">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
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

        {/* Scroll Indicator Mobile */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 md:hidden flex flex-col items-center animate-bounce text-white/80">
          <span className="text-xs font-medium mb-1">Role para ver mais</span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      <section className="py-16 bg-background relative z-20 -mt-8 md:-mt-16">
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
