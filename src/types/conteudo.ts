export type BlockType =
  | 'hero'
  | 'text'
  | 'gallery'
  | 'faq'
  | 'flex'
  | 'grid'
  | 'button'
  | 'spacer'
  | 'image'
  | 'video'

export interface ContentBlock {
  id: string
  type: BlockType
  data: any
  style?: Record<string, string | number>
  children?: ContentBlock[]
}

export interface PageData {
  id?: string
  titulo: string
  slug: string
  status_publicacao: string
  meta_title: string
  meta_description: string
  conteudo: string
}
