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
  | 'vehicle-card'
  | 'stock-slider'
  | 'inventory-grid'

export interface ContentBlock {
  id: string
  type: BlockType
  data: any
  style?: Record<string, string | number>
  children?: ContentBlock[]
}

export interface BlockTemplate {
  id: string
  nome: string
  categoria: string
  conteudo: any
  preview_url?: string
  criado_em: string
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
