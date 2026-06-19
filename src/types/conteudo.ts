export type BlockType = 'hero' | 'text' | 'gallery' | 'faq'

export interface ContentBlock {
  id: string
  type: BlockType
  data: any
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
