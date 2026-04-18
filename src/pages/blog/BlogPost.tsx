import { useState, useEffect } from 'react'
import { SEO } from '@/components/SEO'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

interface Post {
  id: string
  title: string
  slug: string
  category: string
  meta_description: string
  content: string
  author: string
  read_time: string
  image_url: string
  tags: string[]
}

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        setError(true)
      } else {
        setPost(data)
      }
      setLoading(false)
    }

    fetchPost()
  }, [slug])

  if (error) return <Navigate to="/blog" replace />

  if (loading || !post) {
    return (
      <main className="flex-1 bg-background py-10">
        <div className="container max-w-3xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-muted w-1/3 mb-10"></div>
          <div className="h-12 bg-muted w-full mb-6"></div>
          <div className="h-64 bg-muted w-full mb-10 rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted w-full"></div>
            <div className="h-4 bg-muted w-full"></div>
            <div className="h-4 bg-muted w-3/4"></div>
          </div>
        </div>
      </main>
    )
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description,
    author: {
      '@type': 'Organization',
      name: post.author || 'Carro e Cia Veículos',
    },
  }

  const shareUrl = window.location.href
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const wppShare = `https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + shareUrl)}`

  return (
    <main className="flex-1 bg-background py-10">
      <SEO
        title={`${post.title} | Carro e Cia Veículos`}
        description={post.meta_description}
        schema={schema}
        image={post.image_url}
        type="article"
      />
      <article className="container max-w-3xl mx-auto px-4">
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
            <span className="text-sm text-muted-foreground">
              {post.read_time || '5 min'} de leitura
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight text-foreground">
            {post.title}
          </h1>
          <img
            src={post.image_url || `https://img.usecurling.com/p/800/400?q=car%20dealership`}
            alt={post.title}
            className="w-full aspect-video object-cover rounded-xl shadow-sm"
          />
        </header>

        <div
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <footer className="mt-16 pt-8 border-t">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {post.tags?.map((tag) => (
                <Badge
                  variant="outline"
                  key={tag}
                  className="text-sm font-normal py-1 px-3 bg-muted/50"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Compartilhar:</span>
              <Button variant="outline" size="sm" asChild>
                <a href={fbShare} target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={wppShare} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6 border border-border/50">
            <img
              src="https://img.usecurling.com/i?q=car"
              alt="Carro e Cia"
              className="w-16 h-16 rounded-full bg-white p-2 shadow-sm"
            />
            <div className="text-center md:text-left">
              <p className="font-bold text-xl mb-2">{post.author || 'Carro e Cia Veículos'}</p>
              <p className="text-muted-foreground leading-relaxed">
                Somos especialistas em vendas, consignação e financiamento de veículos seminovos em
                Uberaba MG. Mais de 20 anos construindo confiança e realizando negócios seguros.
              </p>
              <Button className="mt-4" asChild>
                <a
                  href="https://api.whatsapp.com/send?phone=5534999948428&text=Ol%C3%A1!%20Li%20um%20artigo%20no%20blog%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar com um Especialista
                </a>
              </Button>
            </div>
          </div>
        </footer>
      </article>
    </main>
  )
}
