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
import { getWhatsAppLink } from '@/lib/whatsapp'
import { Instagram } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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

import { RelatedPosts } from '@/components/blog/RelatedPosts'

export default function BlogPost() {
  const { slug } = useParams()
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scroll = `${totalScroll / windowHeight}`
      setScrollProgress(Number(scroll) * 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const { toast } = useToast()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tocExpanded, setTocExpanded] = useState(false)

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
  const wppShare = getWhatsAppLink(`${post.title} ${shareUrl}`)

  const copyForInstagram = () => {
    navigator.clipboard.writeText(
      `Confira nosso novo artigo: ${post.title}\n\nLeia mais em: ${shareUrl}`,
    )
    toast({
      title: 'Copiado para o Instagram!',
      description: 'Link e legenda copiados. Cole no seu story ou bio do Instagram.',
    })
  }

  const headings =
    post.content.match(/<h2[^>]*>(.*?)<\/h2>/g)?.map((h) => {
      const text = h.replace(/<[^>]+>/g, '')
      // create id from text
      return { text, id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
    }) || []

  // Add IDs to h2 in content for the TOC to work
  const contentWithIds = post.content.replace(/<h2[^>]*>(.*?)<\/h2>/g, (match, p1) => {
    const id = p1.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `<h2 id="${id}">${p1}</h2>`
  })

  return (
    <main className="flex-1 bg-background py-10">
      <div
        className="fixed top-[60px] md:top-0 left-0 h-1 bg-primary z-[1001] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />
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
            alt={`Capa do artigo: ${post.title}`}
            width="800"
            height="400"
            loading="eager"
            className="w-full aspect-video object-cover rounded-xl shadow-sm"
          />
        </header>

        {headings.length > 0 && (
          <div className="mb-10 bg-muted/30 rounded-xl border p-4 md:p-6">
            <div
              className="flex justify-between items-center cursor-pointer md:cursor-default"
              onClick={() => setTocExpanded(!tocExpanded)}
            >
              <h3 className="font-bold text-lg">O que você vai encontrar neste artigo</h3>
              <button className="md:hidden text-primary font-medium text-sm">
                {tocExpanded ? 'Ocultar ▲' : 'Ver índice ▼'}
              </button>
            </div>

            <div className={cn('mt-4 space-y-2', !tocExpanded && 'hidden md:block')}>
              {headings.map((h, i) => (
                <a
                  key={i}
                  href={`#${h.id}`}
                  className="block text-muted-foreground hover:text-primary transition-colors py-1"
                  onClick={() => setTocExpanded(false)}
                >
                  {i + 1}. {h.text}
                </a>
              ))}
            </div>
          </div>
        )}

        <div
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: contentWithIds }}
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Compartilhar:</span>
              <Button variant="outline" size="sm" onClick={copyForInstagram}>
                <Instagram className="w-4 h-4 mr-2 text-pink-600" /> Instagram
              </Button>
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

          <RelatedPosts category={post.category || 'Novidade'} currentId={post.id} />

          <div className="bg-muted/50 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6 border border-border/50">
            <img
              src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
              alt="Logo Carro e Cia"
              width="64"
              height="64"
              loading="lazy"
              className="w-16 h-16 rounded-full bg-white p-2 shadow-sm object-contain"
            />
            <div className="text-center md:text-left">
              <p className="font-bold text-xl mb-2">{post.author || 'Carro e Cia Veículos'}</p>
              <p className="text-muted-foreground leading-relaxed">
                Somos especialistas em vendas, consignação e financiamento de veículos seminovos em
                Uberaba MG. Mais de 20 anos construindo confiança e realizando negócios seguros.
              </p>
              <Button className="mt-4" asChild>
                <a
                  href={getWhatsAppLink(
                    'Olá! Li um artigo no blog e gostaria de mais informações.',
                  )}
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
