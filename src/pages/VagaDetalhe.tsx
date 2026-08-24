import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase, ArrowLeft } from 'lucide-react'
import { getVagaPorIdOuSlug, Vaga } from '@/services/vagas'
import { FormularioCandidatura } from '@/components/FormularioCandidatura'
import { stripHtml } from '@/lib/utils'
import { parseMarkdown } from '@/lib/markdown'
import { useBrandConfig } from '@/hooks/use-brand-config'

export default function VagaDetalhe() {
  const { id } = useParams()
  const [vaga, setVaga] = useState<Vaga | null>(null)
  const [loading, setLoading] = useState(true)
  const { config: brand } = useBrandConfig()

  useEffect(() => {
    if (!id) return
    window.scrollTo(0, 0)
    setLoading(true)
    getVagaPorIdOuSlug(id).then(({ data }) => {
      setVaga(data && data.ativa ? data : null)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <main className="flex-1 bg-background pt-24 pb-16">
        <div className="container max-w-5xl mx-auto px-4 space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </main>
    )
  }

  if (!vaga) {
    return (
      <main className="flex-1 bg-background pt-24 pb-16">
        <div className="container max-w-3xl mx-auto px-4 text-center py-20">
          <p className="text-lg text-muted-foreground mb-4">
            Essa vaga não está mais disponível.
          </p>
          <Link to="/trabalhe-conosco" className="text-primary underline">
            Ver outras oportunidades
          </Link>
        </div>
      </main>
    )
  }

  // Ficha estruturada JobPosting (achado 24/08/2026, pedido da Adriana): é o
  // que faz a vaga poder aparecer na busca de emprego do Google — a tag
  // "meta keywords" que também mandamos abaixo não pesa mais no Google há
  // mais de 15 anos, isso aqui é o que realmente ajuda. validThrough usa um
  // prazo padrão de 60 dias da criação (não temos um campo de "prazo" na
  // vaga ainda) — recomendado pelo Google, mas não inventamos salário nem
  // nada que não temos de verdade.
  const [addressLocality, addressRegion] = brand.city.split(' - ').map((s) => s.trim())
  const jobPostingSchema = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: vaga.titulo,
    description: parseMarkdown(vaga.descricao || vaga.titulo),
    datePosted: vaga.created_at,
    validThrough: new Date(
      new Date(vaga.created_at).getTime() + 60 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: brand.name,
      sameAs: 'https://www.carroeciamotors.com.br',
      logo: brand.logoUrl,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: brand.address,
        addressLocality: addressLocality || 'Uberaba',
        addressRegion: addressRegion || 'MG',
        postalCode: brand.addressCep,
        addressCountry: 'BR',
      },
    },
  }

  return (
    <main className="flex-1 bg-background pt-24 pb-16">
      <SEO
        title={`${vaga.titulo} | Trabalhe Conosco - Carro e Cia Veículos`}
        description={
          stripHtml(parseMarkdown(vaga.descricao || '')).slice(0, 160) ||
          `Vaga de ${vaga.titulo} na Carro e Cia Veículos.`
        }
        canonical={`https://carroeciamotors.com.br/vagas/${vaga.slug || vaga.id}`}
        keywords={vaga.palavras_chave || undefined}
        schema={jobPostingSchema}
      />

      <section className="container max-w-5xl mx-auto px-4">
        <Link
          to="/trabalhe-conosco"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Ver todas as vagas
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Briefcase className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold">{vaga.titulo}</h1>
        </div>

        {vaga.imagem_url && (
          // object-contain (não object-cover) — a imagem gerada por IA é
          // quadrada com um cartão de texto/logo que não pode ser cortado
          // (achado 23/08/2026: object-cover + max-h cortava topo/base da
          // imagem quando o container ficava mais largo que alto).
          <img
            src={vaga.imagem_url}
            alt={vaga.titulo}
            className="w-full max-w-xl aspect-square object-contain rounded-xl border bg-white mb-8 mx-auto"
          />
        )}

        <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="order-2 md:order-1">
            {vaga.descricao && (
              <Card className="p-6 md:p-8">
                <div
                  className="prose prose-sm sm:prose-base max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(vaga.descricao) }}
                />
              </Card>
            )}
          </div>

          <div className="order-1 md:order-2 md:sticky md:top-24">
            <h2 className="text-xl font-bold mb-4">Candidate-se para essa vaga</h2>
            <FormularioCandidatura vagaFixa={{ id: vaga.id, titulo: vaga.titulo }} />
          </div>
        </div>
      </section>
    </main>
  )
}
