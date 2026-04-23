import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { Phone, Mail, MessageCircle, MapPin, Clock, Instagram, Facebook } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { trackCTAClick, trackFormSubmission } from '@/lib/tracking'
import { supabase } from '@/lib/supabase/client'

export default function Contato() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: '',
    prefere_whatsapp: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('leads').insert({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone.replace(/\D/g, ''),
        tipo: 'contato',
        origem: 'Página Contato',
        observacoes: `Assunto: ${formData.assunto}\nPrefere WhatsApp: ${formData.prefere_whatsapp}\nMensagem: ${formData.mensagem}`,
      })
      if (error) throw error
      trackFormSubmission(formData.assunto, 'formulario_contato')
      toast({
        title: 'Mensagem enviada com sucesso!',
        description: 'Obrigado! Entraremos em contato em até 2 horas.',
      })
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        assunto: '',
        mensagem: '',
        prefere_whatsapp: false,
      })
    } catch (err) {
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente ou chame no WhatsApp.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 bg-background pt-24 pb-16">
      <SEO
        title="Contato Carro e Cia | WhatsApp, Email, Telefone - Uberaba"
        description="Entre em contato com Carro e Cia. WhatsApp, email, telefone, mapa. Resposta rápida, atendimento humanizado, soluções certas."
        canonical="https://carroeciamotors.com.br/contato"
      />

      <section className="container max-w-5xl mx-auto px-4 mb-20 text-center">
        <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-4">Vamos Conversar?</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Escolha o melhor jeito de entrar em contato conosco
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <Button
            size="lg"
            className="h-20 text-lg bg-[#25D366] hover:bg-[#20bd5a] text-white flex flex-col gap-1 items-center justify-center p-4 h-auto"
            asChild
          >
            <a
              href={getWhatsAppLink('Olá, gostaria de falar com a Carro e Cia.')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick('WhatsApp Luiz', '/contato')}
            >
              <span className="flex items-center font-bold text-xl">
                <MessageCircle className="mr-2 w-6 h-6" /> WhatsApp Luiz
              </span>
              <span className="text-sm font-normal opacity-90">
                Resposta rápida (máximo 2 horas)
              </span>
            </a>
          </Button>
          <Button
            size="lg"
            className="h-20 text-lg flex flex-col gap-1 items-center justify-center p-4 h-auto"
            asChild
          >
            <a
              href="mailto:contato@carroeciamotors.com.br"
              onClick={() => trackCTAClick('Enviar Email', '/contato')}
            >
              <span className="flex items-center font-bold text-xl">
                <Mail className="mr-2 w-6 h-6" /> Enviar Email
              </span>
              <span className="text-sm font-normal opacity-90">
                Consulta escrita + resposta em 24h
              </span>
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-20 text-lg border-2 flex flex-col gap-1 items-center justify-center p-4 h-auto"
            asChild
          >
            <a
              href="tel:+5534999484285"
              onClick={() => trackCTAClick('Ligação Direta', '/contato')}
            >
              <span className="flex items-center font-bold text-xl">
                <Phone className="mr-2 w-6 h-6" /> Ligação Direta
              </span>
              <span className="text-sm font-normal opacity-90 text-muted-foreground">
                Fale com Luiz agora
              </span>
            </a>
          </Button>
        </div>
      </section>

      <section className="container max-w-6xl mx-auto px-4 mb-20">
        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-display font-bold mb-6">Informações de Contato</h2>

            <Card className="p-6 border-border/50 shadow-sm">
              <h3 className="font-bold text-lg text-primary mb-1">Luiz Fernando</h3>
              <p className="text-sm text-muted-foreground mb-4">Consignação e Vendas</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />{' '}
                  <a href="https://wa.me/5534999484285" className="hover:underline">
                    (34) 99948-4285
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> luiz@carroeciamotors.com.br
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Seg-Sab, 9h-18h
                </li>
              </ul>
            </Card>

            <Card className="p-6 border-border/50 shadow-sm">
              <h3 className="font-bold text-lg text-primary mb-1">Gabriel Araújo</h3>
              <p className="text-sm text-muted-foreground mb-4">Seguros Km Zero e Financiamento</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />{' '}
                  <a href="https://wa.me/5534992000300" className="hover:underline">
                    (34) 99200-0300
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> gabriel@kmzero.com.br
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Seg-Sex, 9h-18h
                </li>
              </ul>
            </Card>

            <Card className="p-6 border-border/50 shadow-sm">
              <h3 className="font-bold text-lg text-primary mb-1">Jessica Germano</h3>
              <p className="text-sm text-muted-foreground mb-4">Documentação e Financeiro</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />{' '}
                  <a href="https://wa.me/5534998037651" className="hover:underline">
                    (34) 99803-7651
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> jessica@carroeciamotors.com.br
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Seg-Sex, 8h-17h
                </li>
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="p-8 shadow-lg border-border/50 bg-card h-full">
              <h2 className="text-2xl font-display font-bold mb-6">Mande Sua Mensagem</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                    <Input
                      id="telefone"
                      required
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(34) 99999-9999"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assunto">Assunto *</Label>
                    <Select
                      value={formData.assunto}
                      onValueChange={(v) => setFormData({ ...formData, assunto: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consignar">Quero consignar meu carro</SelectItem>
                        <SelectItem value="comprar">Quero comprar um carro</SelectItem>
                        <SelectItem value="duvida">Tenho dúvida sobre consignação</SelectItem>
                        <SelectItem value="parceria">Parceria / Negócio</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensagem">Sua Mensagem</Label>
                  <Textarea
                    id="mensagem"
                    rows={4}
                    value={formData.mensagem}
                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                    placeholder="Como podemos ajudar?"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="whatsapp"
                    checked={formData.prefere_whatsapp}
                    onCheckedChange={(c) => setFormData({ ...formData, prefere_whatsapp: !!c })}
                  />
                  <Label htmlFor="whatsapp" className="text-sm font-normal">
                    Prefiro que entrem em contato por WhatsApp
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg mt-4 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20 border-y border-border/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold mb-6">Nossa Localização</h2>
              <div className="bg-card p-6 rounded-xl border shadow-sm mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Carro e Cia Veículos</h3>
                    <p className="text-muted-foreground">
                      Av. Guilherme Ferreira, 1119
                      <br />
                      São Benedito, Uberaba - MG
                      <br />
                      CEP 38022-200
                      <br />
                      Brasil
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <a
                      href="https://maps.google.com/?q=Carro+e+Cia+Veículos+Uberaba"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver no Google Maps
                    </a>
                  </Button>
                </div>
              </div>

              <h3 className="font-bold text-xl mb-4">Horário de Funcionamento</h3>
              <ul className="space-y-2 mb-6 text-muted-foreground">
                <li className="flex justify-between">
                  <span>Segunda a Sexta</span>{' '}
                  <span className="font-medium text-foreground">9:00 - 18:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Sábado</span>{' '}
                  <span className="font-medium text-foreground">9:00 - 14:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Domingo e Feriados</span>{' '}
                  <span className="font-medium text-foreground">Fechado</span>
                </li>
              </ul>
              <p className="text-sm bg-primary/10 text-primary p-3 rounded-lg">
                <strong>Nota:</strong> Consultas após-horário? Mande um WhatsApp que respondemos
                assim que possível!
              </p>
            </div>

            <div className="h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <iframe
                title="Mapa Carro e Cia"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3754.8879051323597!2d-47.93789018845835!3d-19.759916581513842!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94bad1b54ff23a55%3A0x1d3108bae712d85d!2sCarro%20e%20Cia%20Com%C3%A9rcio%20de%20Ve%C3%ADculos!5e0!3m2!1spt-BR!2sbr!4v1776692231909!5m2!1spt-BR!2sbr"
                width="100%"
                height="100%"
                className="border-0"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 text-center container max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-display font-bold mb-6">Por Que Esperar?</h2>
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <Badge variant="secondary" className="text-sm py-2 px-4">
            ✅ Resposta Rápida (Máx 2h)
          </Badge>
          <Badge variant="secondary" className="text-sm py-2 px-4">
            ✅ Consulta Gratuita
          </Badge>
          <Badge variant="secondary" className="text-sm py-2 px-4">
            ✅ Atendimento Humanizado
          </Badge>
          <Badge variant="secondary" className="text-sm py-2 px-4">
            ✅ Soluções Certas
          </Badge>
        </div>
        <Button
          size="lg"
          className="h-14 px-10 text-lg bg-[#25D366] hover:bg-[#20bd5a] text-white"
          asChild
        >
          <a
            href={getWhatsAppLink('Olá! Quero conhecer mais sobre os serviços da loja.')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCTAClick('Vamos lá, mande sua mensagem!', '/contato')}
          >
            Vamos lá, mande sua mensagem!
          </a>
        </Button>

        <div className="mt-16 flex justify-center gap-6">
          <a
            href="https://www.instagram.com/carroecia02"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram /> Instagram
          </a>
          <a
            href="https://www.facebook.com/carroeciaosmelhoresveiculos"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook /> Facebook
          </a>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Dica: No Instagram você vê nossos carros em destaque!
        </p>
      </section>
    </main>
  )
}
