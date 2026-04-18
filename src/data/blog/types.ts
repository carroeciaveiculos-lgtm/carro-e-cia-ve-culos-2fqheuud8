import { ReactNode } from 'react'

export interface BlogPost {
  slug: string
  title: string
  category: string
  tags: string[]
  metaDescription: string
  readTime: string
  author: string
  content: ReactNode
}
