import { useState, useEffect, useMemo } from 'react'
import { SEO } from '@/components/SEO'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Mail, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { trackCTAClick } from '@/lib/tracking'

interface BlogPost {
  id: string
  title: string
  slug: string
  category: string
  meta_description: string
  read_time: string
  image_url: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Consignação: 'bg-[#22c55e] hover:bg-[#22c55e]/90 text-white',
  Compra: 'bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white',
  Vender: 'bg-[#f97316] hover:bg-[#f97316]/90 text-white',
  Financiamento: 'bg-[#a855f7] hover:bg-[#a855f7]/90 text-white',
  Seminovos: 'bg-[#ef4444] hover:bg-[#ef4444]/90 text-white',
}

const CATEGORIES = ['Todos', 'Consignação', 'Compra', 'Vender', 'Financiamento', 'Seminovos']

const getDynamicImageUrl = (post: BlogPost) => {
  if (
    post?.image_url &&
    !post.image_url.includes('modelo-veiculo') &&
    !post.image_url.includes('consignacao')
  ) {
    return post.image_url.replace(/\.(jpg|jpeg|png)$/, '.webp')
  }
  const cleanTitle = (post?.title || 'car business')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ')
  const query = encodeURIComponent(cleanTitle || 'car business')
  let color = 'gray'
  if (post?.category === 'Consignação') color = 'green'
  else if (post?.category === 'Compra') color = 'blue'
  else if (post?.category === 'Vender') color = 'orange'
  else if (post?.category === 'Financiamento') color = 'purple'
  else if (post?.category === 'Seminovos') color = 'red'
  return `https://img.usecurling.com/p/600/338?q=${query}&color=${color}`
}

export default function BlogIndex() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [email, setEmail] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, category, meta_description, read_time, image_url')
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPosts(data)
      }
      setLoading(false)
    }
    fetchPosts()
  }, [])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.meta_description &&
          post.meta_description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'Todos' || post.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [posts, searchTerm, selectedCategory])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    trackCTAClick('Inscrever Newsletter Blog', window.location.href)
    toast({
      title: 'Inscrito com sucesso!',
      description: 'Você receberá nossos próximos artigos no seu e-mail.',
    })
    setEmail('')
  }

  return (
    <main className="flex-1 bg-muted/20 py-10">
      <SEO
        title="Blog Carro e Cia | Guia de Compra, Venda e Financiamento"
        description="Acompanhe as melhores dicas sobre o mercado automotivo em Uberaba. Tudo sobre compra segura, venda rápida, avaliação e financiamento."
      />
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Blog Carro e Cia</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Guias completos e análises honestas para você fazer o melhor negócio com veículos em
            Uberaba.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-10 bg-card p-4 rounded-xl shadow-sm border border-border/50 sticky top-[70px] z-30">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar snap-x">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap snap-start rounded-full"
                size="sm"
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procurar artigo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse border-border/50 shadow-sm">
                <div className="h-48 bg-muted"></div>
                <CardHeader>
                  <div className="h-6 w-24 bg-muted mb-2 rounded-md"></div>
                  <div className="h-8 w-full bg-muted rounded-md"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="flex flex-col h-full hover:shadow-xl transition-all duration-300 overflow-hidden border-border/50 group rounded-xl"
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="block relative overflow-hidden"
                  onClick={() => trackCTAClick(`Ler Artigo: ${post.title}`, window.location.href)}
                >
                  <picture>
                    <source srcSet={getDynamicImageUrl(post)} type="image/webp" />
                    <img
                      src={getDynamicImageUrl(post)}
                      alt={post.title}
                      width="600"
                      height="338"
                      loading="lazy"
                      className="w-full h-[250px] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </picture>
                </Link>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <Badge
                      className={cn(
                        'text-[11px] font-bold tracking-wider px-3 py-1 uppercase rounded-full',
                        CATEGORY_COLORS[post.category || ''] || 'bg-primary',
                      )}
                    >
                      {post.category || 'Novidade'}
                    </Badge>
                  </div>
                  <h3 className="font-display font-bold text-xl leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="line-clamp-3 text-sm text-slate-600 mb-6">
                    {post.meta_description}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" /> {post.read_time || '5 min'}
                    </span>
                    <Button
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs h-9 px-4 rounded-md"
                      asChild
                    >
                      <Link to={`/blog/${post.slug}`}>Ler Artigo →</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredPosts.length === 0 && (
              <div className="col-span-full text-center py-16 bg-card rounded-xl border border-dashed">
                <p className="text-lg text-muted-foreground mb-4">
                  Nenhum artigo encontrado para esta busca.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('Todos')
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="mt-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto shadow-xl">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-3xl font-display font-bold mb-4">
            Receba Dicas Exclusivas Semanalmente
          </h2>
          <p className="text-white/90 mb-8 max-w-lg mx-auto text-base md:text-lg">
            Junte-se a mais de 5.000 pessoas que recebem estratégias comprovadas para não perder
            dinheiro com veículos.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white text-slate-800 placeholder:text-slate-400 h-12 focus-visible:ring-white border-0"
            />
            <Button
              type="submit"
              className="h-12 font-bold px-8 bg-slate-900 hover:bg-slate-800 text-white"
            >
              Inscrever Agora
            </Button>
          </form>
          <p className="text-xs text-white/70 mt-6 font-medium">
            ✓ Sem spam | ✓ Cancele a qualquer momento | ✓ 100% gratuito
          </p>
        </div>
      </div>
    </main>
  )
}
