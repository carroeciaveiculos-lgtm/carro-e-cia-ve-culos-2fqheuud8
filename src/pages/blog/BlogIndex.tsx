import { SEO } from '@/components/SEO'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { blogPosts } from '@/data/blog'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function BlogIndex() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Carro e Cia Veículos',
    description:
      'Tudo o que você precisa saber para fazer o melhor negócio no mercado automotivo de Uberaba.',
    publisher: {
      '@type': 'Organization',
      name: 'Carro e Cia Veículos',
    },
  }

  return (
    <main className="flex-1 bg-muted/20 py-10">
      <SEO
        title="Blog Carro e Cia | Dicas sobre compra, venda e financiamento em Uberaba"
        description="Acompanhe as melhores dicas sobre o mercado automotivo em Uberaba. Tudo sobre compra, venda, avaliação e financiamento consignado de veículos."
        schema={schema}
      />
      <div className="container max-w-5xl">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Início</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Blog</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Blog Carro e Cia</h1>
          <p className="text-lg text-muted-foreground">
            Tudo o que você precisa saber para fazer o melhor negócio no mercado automotivo de
            Uberaba.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post, i) => (
            <Card
              key={post.slug}
              className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden"
            >
              <img
                src={`https://img.usecurling.com/p/600/300?q=car&seed=${i}`}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <CardHeader>
                <div className="mb-3">
                  <Badge variant="secondary">{post.category}</Badge>
                </div>
                <CardTitle className="line-clamp-2 hover:text-primary transition-colors text-xl leading-tight">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </CardTitle>
                <CardDescription className="line-clamp-3 mt-3 text-base">
                  {post.metaDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter className="text-sm text-muted-foreground flex justify-between items-center border-t bg-muted/5 py-4">
                <span>{post.readTime}</span>
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-primary font-medium hover:underline"
                >
                  Ler artigo &rarr;
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
