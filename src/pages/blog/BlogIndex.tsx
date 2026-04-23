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

const CATEGORY_IMAGES: Record<string, string> = {
  Consignação: 'https://img.usecurling.com/p/600/338?q=safe%20contract&color=green',
  Compra: 'https://img.usecurling.com/p/600/338?q=car%20keys&color=blue',
  Vender: 'https://img.usecurling.com/p/600/338?q=deal%20marketing&color=orange',
  Financiamento: 'https://img.usecurling.com/p/600/338?q=calculator%20money&color=purple',
  Seminovos: 'https://img.usecurling.com/p/600/338?q=car%20dealership&color=red',
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
                className="flex flex-col h-full hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50 group"
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="block relative overflow-hidden"
                  onClick={() => trackCTAClick(`Ler Artigo: ${post.title}`, window.location.href)}
                >
                  <picture>
                    <source
                      srcSet={post.image_url?.replace(/\.(jpg|jpeg|png)$/, '.webp') || ''}
                      type="image/webp"
                    />
                    <img
                      src={
                        post.image_url ||
                        CATEGORY_IMAGES[post.category || ''] ||
                        `https://img.usecurling.com/p/600/338?q=car`
                      }
                      alt={post.title}
                      width="600"
                      height="338"
                      loading="lazy"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </picture>
                </Link>
                <CardHeader className="p-5 pb-3">
                  <div className="mb-3">
                    <Badge
                      className={cn(
                        'text-xs',
                        CATEGORY_COLORS[post.category || ''] || 'bg-primary',
                      )}
                    >
                      {post.category || 'Novidade'}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 hover:text-primary transition-colors text-xl leading-tight font-display">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 flex-1">
                  <CardDescription className="line-clamp-3 text-base text-muted-foreground/80">
                    {post.meta_description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="p-5 pt-0 flex justify-between items-center mt-auto">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {post.read_time || '5 min'}
                  </span>
                  <Button
                    variant="ghost"
                    className="text-primary font-bold p-0 hover:bg-transparent hover:text-primary/80"
                    asChild
                  >
                    <Link to={`/blog/${post.slug}`}>Ler Artigo &rarr;</Link>
                  </Button>
                </CardFooter>
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

        <div className="mt-20 bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto shadow-xl">
          <Mail className="w-12 h-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-display font-bold mb-4">Receba Nossas Dicas no E-mail</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto text-lg">
            Junte-se a mais de 5.000 pessoas que recebem semanalmente nossas dicas exclusivas para
            não perder dinheiro com veículos.
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
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 focus-visible:ring-white"
            />
            <Button type="submit" variant="secondary" className="h-12 font-bold px-8">
              Inscrever
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
