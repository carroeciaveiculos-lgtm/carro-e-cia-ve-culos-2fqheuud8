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
import { supabase } from '@/lib/supabase/client'

interface BlogPost {
  id: string
  title: string
  slug: string
  category: string
  meta_description: string
  read_time: string
  image_url: string
}

export default function BlogIndex() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

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
      <div className="container max-w-5xl mx-auto px-4">
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

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted"></div>
                <CardHeader>
                  <div className="h-4 w-20 bg-muted mb-2"></div>
                  <div className="h-6 w-full bg-muted"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-muted mb-2"></div>
                  <div className="h-4 w-2/3 bg-muted"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Card
                key={post.id}
                className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden"
              >
                <picture>
                  <source
                    srcSet={
                      post.image_url || `https://img.usecurling.com/p/600/300?q=car&seed=${i}`
                    }
                    type="image/webp"
                  />
                  <img
                    src={post.image_url || `https://img.usecurling.com/p/600/300?q=car&seed=${i}`}
                    alt={post.title}
                    width="600"
                    height="300"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-48 object-cover"
                  />
                </picture>
                <CardHeader>
                  <div className="mb-3">
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2 hover:text-primary transition-colors text-xl leading-tight">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3 mt-3 text-base">
                    {post.meta_description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1" />
                <CardFooter className="text-sm text-muted-foreground flex justify-between items-center border-t bg-muted/5 py-4">
                  <span>{post.read_time || '5 min'}</span>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-primary font-medium hover:underline"
                  >
                    Ler artigo &rarr;
                  </Link>
                </CardFooter>
              </Card>
            ))}
            {posts.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                Nenhum artigo publicado ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
