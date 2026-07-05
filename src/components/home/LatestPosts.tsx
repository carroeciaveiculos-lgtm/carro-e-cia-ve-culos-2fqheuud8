import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getBlogImageUrl } from '@/lib/blog-utils'

export function LatestPosts() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setPosts(data || []))
  }, [])

  if (posts.length === 0) return null

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-10">Últimas do Blog</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
            >
              <div className="w-full h-48 overflow-hidden">
                <img
                  src={getBlogImageUrl(post, 400, 250)}
                  alt={`Imagem de destaque do artigo: ${post.title}`}
                  width="400"
                  height="250"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <Badge className="w-fit mb-2">{post.category || 'Novidade'}</Badge>
                <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  aria-label={`Ler mais sobre ${post.title}`}
                >
                  <Link to={`/blog/${post.slug}`} target="_self">
                    Ler Mais
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
