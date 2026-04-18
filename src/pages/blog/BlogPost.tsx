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
import { useParams, Navigate, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'

export default function BlogPost() {
  const { slug } = useParams()
  const post = blogPosts.find((p) => p.slug === slug)

  if (!post) return <Navigate to="/blog" replace />

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
  }

  return (
    <main className="flex-1 bg-background py-10">
      <SEO
        title={`${post.title} | Carro e Cia Veículos`}
        description={post.metaDescription}
        schema={schema}
      />
      <article className="container max-w-3xl">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Início</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/blog">Blog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[200px] md:max-w-none">
                {post.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Badge>{post.category}</Badge>
            <span className="text-sm text-muted-foreground">{post.readTime} de leitura</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight text-foreground">
            {post.title}
          </h1>
          <img
            src={`https://img.usecurling.com/p/800/400?q=car%20dealership&seed=${post.slug}`}
            alt={post.title}
            className="w-full aspect-video object-cover rounded-xl shadow-sm"
          />
        </header>

        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-a:text-primary">
          {post.content}
        </div>

        <footer className="mt-16 pt-8 border-t">
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <Badge
                variant="outline"
                key={tag}
                className="text-sm font-normal py-1 px-3 bg-muted/50"
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="bg-muted/50 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6 border border-border/50">
            <img
              src="https://img.usecurling.com/i?q=car"
              alt="Carro e Cia"
              className="w-16 h-16 rounded-full bg-white p-2 shadow-sm"
            />
            <div className="text-center md:text-left">
              <p className="font-bold text-xl mb-2">{post.author}</p>
              <p className="text-muted-foreground leading-relaxed">
                Somos especialistas em vendas, consignação e financiamento de veículos seminovos em
                Uberaba MG. Mais de 20 anos construindo confiança e realizando negócios seguros.
              </p>
            </div>
          </div>
        </footer>
      </article>
    </main>
  )
}
