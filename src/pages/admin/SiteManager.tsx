import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Layout,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Share2,
  Instagram,
  Download,
  Copy,
  Facebook,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface BlogPost {
  id: string
  title: string
  slug: string
  published: boolean
  category: string
  meta_description?: string
  image_url?: string
}

export default function SiteManager() {
  const [activeTab, setActiveTab] = useState('geral')
  const [searchQuery, setSearchQuery] = useState('')
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (activeTab === 'blog') {
      fetchBlogPosts()
    }
  }, [activeTab])

  const fetchBlogPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, published, category')
      .order('created_at', { ascending: false })
    if (data) setBlogPosts(data)
  }

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({ published: !currentStatus })
      .eq('id', id)
    if (!error) {
      toast({ title: 'Status atualizado com sucesso!' })
      fetchBlogPosts()
    } else {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (!error) {
      toast({ title: 'Post excluído com sucesso!' })
      fetchBlogPosts()
    }
  }

  const teamPhotos = [
    {
      name: 'Adriana',
      url: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Adriana%20foto%20profissional.jpeg',
    },
    {
      name: 'Jéssica',
      url: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Ljessica%20foto%20profissional.jpeg',
    },
    {
      name: 'Luiz Fernando',
      url: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Luiz%20Fernando%20foto%20profissional.jpeg',
    },
    {
      name: 'Roberto Junior',
      url: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Roberto%20Junior%20foto%20profissional.jpeg',
    },
  ]

  const partnerLogos = [
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Bradesco.png',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/BV.png',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/PORTO%20BANK%20LOGO.png',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Safra.jpeg',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/santander.png',
  ]

  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isSocialHubOpen, setIsSocialHubOpen] = useState(false)

  const copyForInstagram = (post: BlogPost) => {
    const url = `${import.meta.env.VITE_SITE_URL || 'https://carroeciaveiculos.goskip.app'}/blog/${post.slug}`
    const text = `Confira nosso novo artigo: ${post.title}\n\n${post.meta_description || ''}\n\nLeia mais no link da bio! 🚗💨\n\n#CarroECia #Uberaba #Seminovos`
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado para o Instagram!',
      description: 'Legenda e link copiados com sucesso.',
    })
  }

  const downloadCard = (post: BlogPost) => {
    toast({ title: 'Gerando card...', description: 'O download iniciará em instantes.' })
    setTimeout(() => {
      window.open(post.image_url || 'https://img.usecurling.com/p/800/800?q=car', '_blank')
    }, 1000)
  }

  const filteredPosts = blogPosts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" /> CMS & Gestão do Site
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle banners, textos, blog dinâmico, SEO e parceiros.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Busca global (veículos, posts)..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">Salvar Tudo</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0">
          <div className="flex flex-col gap-1">
            <Button
              variant={activeTab === 'geral' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('geral')}
            >
              Dados da Loja & SEO
            </Button>
            <Button
              variant={activeTab === 'blog' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('blog')}
            >
              Blog & Artigos
            </Button>
            <Button
              variant={activeTab === 'lps' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('lps')}
            >
              Landing Pages
            </Button>
            <Button
              variant={activeTab === 'imagens' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('imagens')}
            >
              Galeria & Mídias
            </Button>
            <Button
              variant={activeTab === 'conteudo' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('conteudo')}
            >
              Equipe & Textos
            </Button>
            <Button
              variant={activeTab === 'depoimentos' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('depoimentos')}
            >
              Depoimentos
            </Button>
            <Button
              variant={activeTab === 'scripts' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('scripts')}
            >
              Scripts & Tags
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 min-h-[500px]">
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Layout className="w-5 h-5" /> Configurações Gerais & SEO Global
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Loja</Label>
                  <Input defaultValue="Carro e Cia Veículos" />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input defaultValue="17.125.199/0001-87" />
                </div>
                <div>
                  <Label>Telefone Principal (WhatsApp)</Label>
                  <Input defaultValue="(34) 99994-8428" />
                </div>
                <div>
                  <Label>E-mail de Contato</Label>
                  <Input defaultValue="lgacomerciodeveiculos@gmail.com" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Endereço Completo</Label>
                  <Input defaultValue="Av. Guilherme Ferreira, 1131 - São Benedito, Uberaba - MG" />
                </div>
                <div className="sm:col-span-2 mt-4">
                  <h4 className="font-semibold mb-2">SEO Padrão da Home</h4>
                </div>
                <div className="sm:col-span-2">
                  <Label>Title Tag (Meta Título)</Label>
                  <Input defaultValue="Carro e Cia Veículos | Os Melhores Seminovos de Uberaba" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Meta Description</Label>
                  <Textarea defaultValue="Venda seu carro com segurança. Consignação e financiamento de veículos em Uberaba. Mais de 20 anos de mercado." />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recomendado: 150-160 caracteres.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blog' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Gestão Centralizada de Conteúdo
                </h3>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    setEditingPost({
                      id: 'new',
                      title: '',
                      slug: '',
                      published: false,
                      category: '',
                    })
                  }
                >
                  <Plus className="w-4 h-4" /> Novo Post
                </Button>
              </div>
              <div className="grid gap-4">
                {filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800">{post.title}</h4>
                      <div className="flex gap-2 items-center mt-1 text-sm text-slate-500">
                        <Badge variant="outline" className="bg-slate-50">
                          {post.category}
                        </Badge>
                        <span className="hidden sm:inline">/{post.slug}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublish(post.id, post.published)}
                        className={post.published ? 'text-green-600' : 'text-slate-400'}
                      >
                        {post.published ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        <span className="hidden sm:inline">
                          {post.published ? 'Publicado' : 'Rascunho'}
                        </span>
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingPost(post)
                          setIsSocialHubOpen(true)
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-2" /> Social Hub
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        title="Editar"
                        onClick={() => setEditingPost(post)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        title="Excluir"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {filteredPosts.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum artigo encontrado.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'lps' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Layout className="w-5 h-5" /> Landing Pages & SEO Otimizado
                </h3>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" /> Nova Página
                </Button>
              </div>
              <div className="grid gap-4">
                {[
                  '/carros-seminovos-uberaba-mg',
                  '/financiamento-veiculo-consignado',
                  '/venda-seu-carro-rapido-uberaba',
                ].map((path, i) => (
                  <Card
                    key={i}
                    className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        {path.replace('/', '').replace(/-/g, ' ').toUpperCase()}
                      </h4>
                      <p className="text-sm text-blue-600 font-medium">{path}</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Edit className="w-4 h-4 mr-2" /> Editar SEO / Conteúdo
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'imagens' && (
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5" /> Bancos Parceiros
                </h3>
                <div className="flex flex-wrap gap-4">
                  {partnerLogos.map((url, i) => (
                    <div
                      key={i}
                      className="w-24 h-16 border rounded-lg p-2 flex items-center justify-center bg-slate-50"
                    >
                      <img
                        src={url}
                        alt="Partner Logo"
                        className="max-w-full max-h-full object-contain mix-blend-multiply"
                      />
                    </div>
                  ))}
                  <div className="w-24 h-16 border border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400 text-xs text-center p-2">
                    + Adicionar
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5" /> Fachada e Logo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border p-2 rounded-lg text-center">
                    <img
                      src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
                      className="h-20 mx-auto object-contain mb-2"
                      alt="Logo"
                    />
                    <p className="text-xs text-slate-500">Logo Principal</p>
                  </div>
                  <div className="border p-2 rounded-lg text-center">
                    <img
                      src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg"
                      className="h-20 mx-auto object-cover rounded mb-2"
                      alt="Fachada"
                    />
                    <p className="text-xs text-slate-500">Foto Fachada</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conteudo' && (
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" /> Equipe Carro e Cia
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {teamPhotos.map((member, i) => (
                    <Card key={i} className="overflow-hidden">
                      <img
                        src={member.url}
                        alt={member.name}
                        className="w-full h-32 object-cover object-top"
                      />
                      <div className="p-2 text-center text-sm font-bold text-slate-700 bg-slate-50">
                        {member.name}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <Label>Texto Página "Sobre Nós"</Label>
                <Textarea
                  className="h-32 mt-2"
                  defaultValue="Mais de 20 anos de confiança. Conectar vendedores e compradores com segurança é a nossa missão."
                />
              </div>
            </div>
          )}

          {activeTab === 'depoimentos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Depoimentos de Clientes
                </h3>
                <Button size="sm">Adicionar Depoimento</Button>
              </div>
              <Card>
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                    <img
                      src="https://img.usecurling.com/ppl/thumbnail?seed=1&gender=female"
                      alt="Avatar"
                    />
                  </div>
                  <div>
                    <p className="font-bold">Maria Oliveira</p>
                    <p className="text-sm text-slate-600">
                      "Vendi meu carro em menos de uma semana! Equipe nota 10."
                    </p>
                  </div>
                  <div className="ml-auto text-amber-500 font-bold whitespace-nowrap">★★★★★</div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" /> Tags de Rastreamento & Automações
              </h3>
              <p className="text-sm text-slate-500">
                As tags abaixo garantem a rastreabilidade total no CRM.
              </p>
              <div className="grid gap-4">
                <div>
                  <Label>Google Analytics (GA4) ID</Label>
                  <Input defaultValue="G-7NCHPJ2SLT" readOnly className="bg-slate-50 font-mono" />
                </div>
                <div>
                  <Label>Google Tag Manager (GTM) ID</Label>
                  <Input defaultValue="GTM-N7LFK82W" readOnly className="bg-slate-50 font-mono" />
                </div>
                <div>
                  <Label>Clarity ID</Label>
                  <Input defaultValue="wb6vgqmca2" readOnly className="bg-slate-50 font-mono" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!editingPost}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPost(null)
            setIsSocialHubOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isSocialHubOpen ? 'Social Hub - Compartilhamento' : 'Editar Post'}
            </DialogTitle>
          </DialogHeader>

          {editingPost && (
            <div className="mt-4">
              {isSocialHubOpen ? (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold flex items-center gap-2 mb-2">
                        <Instagram className="w-5 h-5 text-pink-600" /> Instagram & Redes Sociais
                      </h4>
                      <p className="text-sm text-slate-500 mb-4">
                        Gere legendas otimizadas e copie o link para compartilhar facilmente.
                      </p>

                      <div className="space-y-3">
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => copyForInstagram(editingPost)}
                        >
                          <Copy className="w-4 h-4 mr-2" /> Copiar Legenda + Link
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => downloadCard(editingPost)}
                        >
                          <Download className="w-4 h-4 mr-2" /> Baixar Card do Post (Imagem)
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-bold flex items-center gap-2 mb-4">
                        Tags Open Graph (OG)
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <Label>OG Title (Título de Compartilhamento)</Label>
                          <Input defaultValue={editingPost.title} />
                        </div>
                        <div>
                          <Label>OG Description</Label>
                          <Textarea defaultValue={editingPost.meta_description} className="h-20" />
                        </div>
                        <div>
                          <Label>OG Image URL</Label>
                          <Input
                            defaultValue={
                              editingPost.image_url || 'https://img.usecurling.com/p/800/400?q=car'
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl border">
                    <h4 className="font-bold flex items-center gap-2 mb-4 text-slate-700">
                      <Facebook className="w-5 h-5 text-blue-600" /> Social Preview
                    </h4>
                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden mt-4">
                      <img
                        src={editingPost.image_url || 'https://img.usecurling.com/p/800/400?q=car'}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4 bg-slate-100">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                          carroeciaveiculos.goskip.app
                        </p>
                        <h5 className="font-bold text-slate-900 line-clamp-1">
                          {editingPost.title}
                        </h5>
                        <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                          {editingPost.meta_description ||
                            'Descrição do artigo aparecerá aqui nas redes sociais...'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 text-center">
                      É assim que seu link aparecerá no WhatsApp, Facebook e LinkedIn.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Título</Label>
                      <Input defaultValue={editingPost.title} />
                    </div>
                    <div>
                      <Label>Slug (URL)</Label>
                      <Input defaultValue={editingPost.slug} />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Input defaultValue={editingPost.category} />
                    </div>
                    <div className="col-span-2">
                      <Label>Meta Description</Label>
                      <Textarea defaultValue={editingPost.meta_description} className="h-20" />
                    </div>
                    <div className="col-span-2">
                      <Label>Conteúdo (HTML)</Label>
                      <Textarea
                        defaultValue="<p>Escreva seu post aqui...</p>"
                        className="h-64 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setEditingPost(null)}>
                      Cancelar
                    </Button>
                    <Button>Salvar Post</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
