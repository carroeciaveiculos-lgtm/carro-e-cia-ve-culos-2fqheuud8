import { useState, useEffect, useMemo } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowLeft, Share2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getWhatsAppLink } from '@/lib/whatsapp'

interface BlogPostData {
  id: string
  title: string
  slug: string
  category: string
  meta_description: string
  content: string
  image_url: string
  author: string
  read_time: string
  tags: string[]
  published: boolean
  created_at: string
  updated_at: string
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  category: string
  image_url: string
  created_at: string
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPostData | null>(null)
  const [related, setRelated] = useState<RelatedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)

    supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setPost(data as BlogPostData)
        setLoading(false)

        if (data) {
          supabase
            .from('blog_posts')
            .select('id, title, slug, category, image_url, created_at')
            .eq('published', true)
            .eq('category', (data as BlogPostData).category)
            .neq('id', (data as BlogPostData).id)
            .order('created_at', { ascending: false })
            .limit(3)
            .then(({ data: relData }) => {
              setRelated((relData as RelatedPost[]) || [])
            })
        }
      })
  }, [slug])

  const formattedDate = useMemo(() => {
    if (!post) return ''
    return new Date(post.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }, [post])

  const schema = useMemo(() => {
    if (!post) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.meta_description || '',
      image: post.image_url || '',
      author: { '@type': 'Organization', name: post.author || 'Carro e Cia Veículos' },
      datePublished: post.created_at,
      dateModified: post.updated_at,
      publisher: {
        '@type': 'Organization',
        name: 'Carro e Cia Veículos',
      },
    }
  }, [post])

  const handleShare = () => {
    if (navigator.share && post) {
      navigator.share({ title: post.title, url: window.location.href })
    } else {
      navigator.clipboard?.writeText(window.location.href)
    }
  }

  if (notFound) {
    return <Navigate to="/blog" replace />
  }

  if (loading || !post) {
    return (
      <main className="flex-1 bg-background pt-24 pb-16 min-h-screen">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-12 w-3/4 bg-muted rounded" />
            <div className="h-72 w-full bg-muted rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
              <div className="h-4 w-4/6 bg-muted rounded" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 bg-background pt-24 pb-16">
      <SEO
        title={post.title}
        description={post.meta_description || post.title}
        schema={schema}
        canonical={`https://www.carroeciamotors.com.br/blog/${post.slug}`}
      />

      <article className="container max-w-4xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium truncate">{post.title}</span>
        </nav>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {post.category && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              {post.category}
            </Badge>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {formattedDate}
            </span>
            {post.read_time && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {post.read_time}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-slate-800 mb-6 leading-tight">
          {post.title}
        </h1>

        {post.image_url && (
          <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-[300px] md:h-[450px] object-cover"
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {(post.author || 'C')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {post.author || 'Carro e Cia Veículos'}
              </p>
              <p className="text-xs text-muted-foreground">Autor</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" /> Compartilhar
          </Button>
        </div>

        <div
          className="prose prose-lg max-w-none text-slate-700 leading-relaxed blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-muted-foreground">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 p-8 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white text-center shadow-xl">
          <h3 className="text-2xl font-bold mb-3">Ficou com dúvidas?</h3>
          <p className="mb-6 opacity-90">
            Fale com nossa equipe e descubra como podemos ajudar você a fazer o melhor negócio.
          </p>
          <Button
            className="w-full sm:w-auto bg-white text-[#25D366] hover:bg-slate-50 font-bold px-8 h-12"
            asChild
          >
            <a
              href={getWhatsAppLink('Olá! Vim pelo blog e gostaria de mais informações.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              CHAMAR NO WHATSAPP
            </a>
          </Button>
        </div>

        <div className="mt-10">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/blog">
              <ArrowLeft className="w-4 h-4" /> Voltar para o Blog
            </Link>
          </Button>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-16 bg-muted/30 py-16 border-y border-border/50">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-8 text-center">
              Artigos Relacionados
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((rp) => (
                <Link key={rp.id} to={`/blog/${rp.slug}`} className="group">
                  <Card className="overflow-hidden border-border/50 shadow-sm h-full transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                    {rp.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={rp.image_url}
                          alt={rp.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {rp.category && (
                        <Badge
                          variant="secondary"
                          className="mb-2 text-xs bg-primary/10 text-primary border-0"
                        >
                          {rp.category}
                        </Badge>
                      )}
                      <h3 className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                        {rp.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(rp.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
