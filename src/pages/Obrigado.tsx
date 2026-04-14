import { CheckCircle2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Obrigado() {
  const wppText = encodeURIComponent(
    'Olá Roberto! Acabei de me cadastrar no site e gostaria de prioridade no meu atendimento.',
  )

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted/30 flex items-center justify-center py-20 px-4">
      <div className="max-w-2xl w-full bg-card rounded-2xl shadow-xl p-8 md:p-12 text-center border border-border">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4 text-foreground">
          Seu cadastro foi recebido!
        </h1>

        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
          Nossa equipe já está analisando suas informações. Mas se você tem pressa e quer a melhor
          negociação de Uberaba agora mesmo, fale direto comigo.
        </p>

        <div className="bg-muted p-6 rounded-xl mb-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-background shadow-md">
            <img
              src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1"
              alt="Roberto"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-bold text-lg">Roberto</h3>
          <p className="text-sm text-muted-foreground">Especialista em Negócios Automotivos</p>
        </div>

        <Button
          asChild
          className="w-full h-16 text-sm md:text-xl font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg animate-pulse whitespace-normal h-auto py-4"
        >
          <a
            href={`https://wa.me/5534999484285?text=${wppText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-6 h-6 shrink-0" />
            Clique aqui para furar a fila no WhatsApp
          </a>
        </Button>
      </div>
    </div>
  )
}
