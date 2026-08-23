import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { Card } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'
import { listVagasAtivas } from '@/services/vagas'
import { FormularioCandidatura } from '@/components/FormularioCandidatura'

export default function TrabalheConosco() {
  const [vagasAtivas, setVagasAtivas] = useState<{ id: string; titulo: string; slug: string | null }[]>(
    [],
  )

  useEffect(() => {
    listVagasAtivas().then(({ data }) => setVagasAtivas(data || []))
  }, [])

  return (
    <main className="flex-1 bg-background pt-24 pb-16">
      <SEO
        title="Trabalhe Conosco | Carro e Cia Veículos"
        description="Faça parte do time Carro e Cia Veículos em Uberaba - MG. Envie seu currículo e conheça nossas vagas abertas."
        canonical="https://carroeciamotors.com.br/trabalhe-conosco"
      />

      <section className="container max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-4">
            Trabalhe Conosco
          </h1>
          <p className="text-xl text-muted-foreground">
            Há mais de 20 anos construindo uma equipe apaixonada por atender bem. Se você quer
            fazer parte do time Carro e Cia, deixe seus dados e seu currículo abaixo.
          </p>
        </div>

        {vagasAtivas.length > 0 && (
          <Card className="p-6 mb-10 border-primary/30 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg mb-1">Temos vaga!</h2>
                <p className="text-muted-foreground mb-2">
                  No momento estamos com as seguintes oportunidades abertas:
                </p>
                <ul className="list-disc list-inside space-y-1 font-medium">
                  {vagasAtivas.map((v) => (
                    <li key={v.id}>
                      {v.slug ? (
                        <Link to={`/vagas/${v.slug}`} className="underline hover:text-primary">
                          {v.titulo}
                        </Link>
                      ) : (
                        v.titulo
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <FormularioCandidatura vagasAtivas={vagasAtivas} />
      </section>
    </main>
  )
}
