import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function RelatedPosts({ category, currentId }: { category: string; currentId: string }) {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    if (!category) return
    supabase
      .from('blog_posts')
      .select('id, title, slug, image_url, category, read_time')
      .eq('published', true)
      .eq('category', category)
      .neq('id', currentId)
      .limit(3)
      .then(({ data }) => setPosts(data || []))
  }, [category, currentId])

  if (posts.length === 0) return null

  return (
    <div className="my-16 border-t pt-10">
      <h3 className="text-2xl font-bold mb-6">Continue lendo...</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`} target="_self">
            <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
              <img
                src={post.image_url || `https://img.usecurling.com/p/400/250?q=car`}
                alt={post.title}
                width="400"
                height="250"
                loading="lazy"
                className="w-full h-40 object-cover"
              />
              <CardHeader className="p-4">
                <Badge className="w-fit mb-2">{post.category}</Badge>
                <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {post.read_time || '5 min'} de leitura
                </p>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
