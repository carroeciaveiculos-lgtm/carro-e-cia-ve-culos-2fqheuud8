import { useState } from 'react'
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { SEO } from '@/components/SEO'

export default function Contato() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('leads').insert([
        {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          tipo: 'contato',
          origem: 'site',
          observacoes: `Assunto: ${formData.assunto}\nMensagem: ${formData.mensagem}`,
          status: 'novo',
        },
      ])

      if (error) throw error

      await supabase.functions.invoke('send-lead-email', {
        body: {
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          veiculo: 'Contato Geral',
          mensagem: `Assunto: ${formData.assunto}\nMensagem: ${formData.mensagem}`,
          origem: 'Site - Contato',
        },
      })

      toast({
        title: 'Mensagem Enviada!',
        description: 'Sua mensagem foi enviada com sucesso! Em breve entraremos em contato.',
      })
      setFormData({ nome: '', email: '', telefone: '', assunto: '', mensagem: '' })
    } catch (err) {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua mensagem. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEO
        title="Entre em Contato | Carro e Cia Veículos"
        description="Entre em contato com a Carro e Cia Veículos. Telefone, WhatsApp e endereço. Estamos localizados em Uberaba, MG."
      />
      <section className="bg-secondary text-white py-20 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-6">Fale Conosco</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Estamos prontos para te atender. Envie sua mensagem ou entre em contato pelos nossos
            canais diretos.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_400px] gap-12">
            <div className="bg-card rounded-2xl p-8 border shadow-sm">
              <h2 className="text-3xl font-display font-bold mb-8">Envie Sua Mensagem</h2>
              <form onSubmit={handleSubmit} className="space-y-6" data-event="contato">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nome completo *</label>
                    <Input
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">E-mail *</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">WhatsApp *</label>
                    <Input
                      required
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assunto *</label>
                    <Input
                      required
                      value={formData.assunto}
                      onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                      className="h-12"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Mensagem *</label>
                  <Textarea
                    required
                    value={formData.mensagem}
                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                    className="min-h-[150px] resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </form>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-display font-bold mb-6">Nossos Contatos</h2>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-base">Endereço</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Av. Guilherme Ferreira, 1119
                        <br />
                        São Benedito, Uberaba - MG
                        <br />
                        CEP: 38022-200
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 shrink-0 bg-[#25D366]/10 rounded-full flex items-center justify-center text-[#25D366]">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-base">WhatsApp</h3>
                      <a
                        href="https://wa.me/5534999484285?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        (34) 99948-4285
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-base">E-mail</h3>
                      <a
                        href="mailto:lgacomerciodeveiculos@gmail.com"
                        className="text-muted-foreground hover:text-primary transition-colors text-sm break-all"
                      >
                        lgacomerciodeveiculos@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t">
                <h2 className="text-xl font-display font-bold mb-4">Redes Sociais</h2>
                <div className="flex gap-4">
                  <a
                    href="https://instagram.com/carroecia02"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Siga-nos no Instagram"
                    className="w-12 h-12 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Instagram className="w-5 h-5" aria-hidden="true" />
                  </a>
                  <a
                    href="https://www.facebook.com/carroeciaosmelhoresveiculos"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Siga-nos no Facebook"
                    className="w-12 h-12 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Facebook className="w-5 h-5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 rounded-2xl overflow-hidden shadow-sm h-[400px] border">
            <iframe
              title="Mapa interativo mostrando a localização da loja Carro e Cia Veículos"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3755.932468759535!2d-47.93268868461794!3d-19.76810008669527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94bad00010839e0d%3A0xc3cf4813589b9d31!2sCarro%20%26%20Cia%20Ve%C3%ADculos!5e0!3m2!1spt-BR!2sbr!4v1714570198270!5m2!1spt-BR!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  )
}
