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
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState({ autor_nome: '', autor_email: '', conteudo: '' })
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

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
        fetchComments(data.id)
      }
      setLoading(false)
    }

    const fetchComments = async (postId: string) => {
      const { data } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('publicado', true)
        .order('created_at', { ascending: false })
      if (data) setComments(data)
    }

    fetchPost()
  }, [slug])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.autor_nome || !newComment.autor_email || !newComment.conteudo || !post) return
    setIsSubmittingComment(true)
    const { error } = await supabase.from('blog_comments').insert({
      post_id: post.id,
      autor_nome: newComment.autor_nome,
      autor_email: newComment.autor_email,
      conteudo: newComment.conteudo,
      publicado: false,
    })
    setIsSubmittingComment(false)
    if (!error) {
      toast({
        title: 'Comentário enviado!',
        description: 'Seu comentário será analisado pela nossa equipe antes de ser publicado.',
      })
      setNewComment({ autor_nome: '', autor_email: '', conteudo: '' })
    } else {
      toast({ title: 'Erro ao enviar comentário.', variant: 'destructive' })
    }
  }

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

  const getDynamicImageUrl = (postObj: Post) => {
    if (
      postObj?.image_url &&
      postObj.image_url.trim() !== '' &&
      !postObj.image_url.includes('modelo-veiculo') &&
      !postObj.image_url.includes('consignacao')
    ) {
      return postObj.image_url.replace(/\.(jpg|jpeg|png)$/, '.webp')
    }

    // Generate highly contextual fallback image based on category and title
    const titleWords = (postObj?.title || '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .split(' ')
    let searchContext = 'car dealership'

    if (postObj?.category === 'Consignação' || postObj?.title.toLowerCase().includes('consigna'))
      searchContext = 'car handshake agreement'
    else if (
      postObj?.category === 'Financiamento' ||
      postObj?.title.toLowerCase().includes('financ')
    )
      searchContext = 'car finance money'
    else if (postObj?.category === 'Segurança' || postObj?.title.toLowerCase().includes('segur'))
      searchContext = 'car security shield'
    else if (
      postObj?.category === 'Documentação' ||
      postObj?.title.toLowerCase().includes('document')
    )
      searchContext = 'car documents signature'
    else if (titleWords.length > 0) searchContext = `car ${titleWords.slice(0, 2).join(' ')}`

    const query = encodeURIComponent(searchContext)
    let color = 'gray'
    if (postObj?.category === 'Consignação') color = 'green'
    else if (postObj?.category === 'Compra') color = 'blue'
    else if (postObj?.category === 'Vender') color = 'orange'
    else if (postObj?.category === 'Financiamento') color = 'purple'
    else if (postObj?.category === 'Seminovos') color = 'red'
    return `https://img.usecurling.com/p/1200/630?q=${query}&color=${color}&dpr=2`
  }

  const resolvedImageUrl = getDynamicImageUrl(post)

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description,
      image: resolvedImageUrl,
      author: {
        '@type': 'Organization',
        name: post.author || 'Carro e Cia Veículos',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: 'https://carroeciamotors.com.br',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: 'https://carroeciamotors.com.br/blog',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: `https://carroeciamotors.com.br/blog/${post.slug}`,
        },
      ],
    },
  ]

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
        image={resolvedImageUrl}
        type="article"
        keywords={post.tags?.join(', ')}
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
          <picture>
            <source
              srcSet={`${resolvedImageUrl} 1200w`}
              sizes="(max-width: 768px) 100vw, 1200px"
              type="image/webp"
            />
            <img
              src={resolvedImageUrl}
              srcSet={`${resolvedImageUrl} 1200w`}
              sizes="(max-width: 768px) 100vw, 1200px"
              alt={`Capa do artigo: ${post.title}`}
              width="1200"
              height="630"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full aspect-video object-cover rounded-xl shadow-sm"
            />
          </picture>
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

          <div className="my-16 credibilidade-card bg-muted/30 p-8 rounded-2xl border text-center">
            <h3 className="text-2xl font-display font-bold mb-8">Conheça Nossos Especialistas</h3>

            <div className="grid md:grid-cols-2 gap-8 items-start max-w-3xl mx-auto">
              <div className="flex flex-col items-center">
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Luiz-Fernando-foto-profissional.webp"
                  alt="Luiz Fernando, proprietário Carro e Cia com 20+ anos de experiência"
                  loading="lazy"
                  width="140"
                  height="140"
                  className="rounded-full mb-4 shadow-md object-cover object-top w-[140px] h-[140px] border-4 border-background aspect-square flex-shrink-0"
                />
                <h4 className="font-bold text-xl font-display">Luiz Fernando</h4>
                <p className="text-muted-foreground mb-2">
                  Proprietário Carro e Cia
                  <br />
                  20+ anos no mercado
                </p>
                <p className="text-sm italic">"Sua segurança é nossa prioridade"</p>
              </div>

              <div className="flex flex-col items-center">
                <img
                  src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/Gabriel-foto-profissional.webp"
                  alt="Gabriel Araújo, especialista Km Zero Seguros e financiamentos"
                  loading="lazy"
                  width="150"
                  height="150"
                  className="rounded-full mb-4 shadow-md object-cover w-[150px] h-[150px] border-4 border-background"
                />
                <h4 className="font-bold text-xl font-display">Gabriel Araújo</h4>
                <p className="text-muted-foreground mb-2">
                  Especialista Km Zero Seguros
                  <br />
                  Crédito e Financiamento
                </p>
                <p className="text-sm italic">"Melhor taxa, melhor cobertura"</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-border">
              <p className="font-medium text-lg mb-4">
                Precisa de uma avaliação ou cotação honesta?
              </p>
              <Button size="lg" asChild className="bg-[#25D366] hover:bg-[#20bd5a] text-white">
                <a
                  href={getWhatsAppLink(
                    `Olá! Gostaria de falar com os especialistas sobre o artigo: ${post.title}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="my-16">
            <h3 className="text-2xl font-bold mb-8">Comentários ({comments.length})</h3>

            {comments.length > 0 ? (
              <div className="space-y-6 mb-12">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-muted/20 p-6 rounded-xl border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {comment.autor_nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{comment.autor_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-700 mt-3">{comment.conteudo}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-12">
                Nenhum comentário publicado ainda. Seja o primeiro!
              </p>
            )}

            <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
              <h3 className="text-2xl font-bold mb-2">💬 Deixe Seu Comentário</h3>
              <p className="text-muted-foreground mb-6">
                Dúvidas sobre o assunto? Compartilhe sua experiência ou faça uma pergunta.
              </p>

              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seu Nome</label>
                    <input
                      type="text"
                      required
                      value={newComment.autor_nome}
                      onChange={(e) => setNewComment({ ...newComment, autor_nome: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Como deseja ser chamado"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seu E-mail (não será publicado)</label>
                    <input
                      type="email"
                      required
                      value={newComment.autor_email}
                      onChange={(e) =>
                        setNewComment({ ...newComment, autor_email: e.target.value })
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sua Mensagem</label>
                  <textarea
                    required
                    value={newComment.conteudo}
                    onChange={(e) => setNewComment({ ...newComment, conteudo: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
                    placeholder="Escreva seu comentário..."
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="w-full sm:w-auto px-8"
                >
                  {isSubmittingComment ? 'Enviando...' : 'Publicar Comentário'}
                </Button>
              </form>

              <div className="mt-8 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">Precisa de resposta rápida?</p>
                <Button
                  variant="outline"
                  asChild
                  className="text-[#25D366] border-[#25D366] hover:bg-[#25D366]/10"
                >
                  <a
                    href={getWhatsAppLink(
                      `Olá! Li o artigo "${post?.title}" e gostaria de tirar uma dúvida.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Fazer Pergunta no WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6 border border-border/50">
            <picture>
              <source
                srcSet="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
                type="image/webp"
              />
              <img
                src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo-carro-e-cia1.webp"
                alt="Logo Carro e Cia"
                width="64"
                height="64"
                loading="lazy"
                className="w-16 h-16 rounded-full bg-white p-2 shadow-sm object-contain"
              />
            </picture>
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

          <div className="mt-16 bg-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Assine nossa Newsletter</h3>
            <p className="text-muted-foreground mb-6">
              Receba nossos próximos artigos e dicas direto no seu e-mail.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault()
                toast({ title: 'Inscrito!', description: 'Obrigado por assinar nossa newsletter.' })
              }}
            >
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                required
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 h-10"
              />
              <Button type="submit" className="h-10">
                Inscrever
              </Button>
            </form>
          </div>
        </footer>
      </article>
    </main>
  )
}
