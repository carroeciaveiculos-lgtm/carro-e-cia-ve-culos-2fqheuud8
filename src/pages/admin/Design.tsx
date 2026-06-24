import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus,
  ImageIcon,
  MessageSquare,
  Trash2,
  LayoutTemplate,
  Loader2,
  Star,
  Edit,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'

export default function Design() {
  const [activeTab, setActiveTab] = useState('banners')
  const [depoimentos, setDepoimentos] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const { toast } = useToast()

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false)
  const [isDepoimentoModalOpen, setIsDepoimentoModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [bannerForm, setBannerForm] = useState<any>({
    titulo: '',
    texto: '',
    botao_texto: '',
    botao_link: '',
    ordem: 0,
    ativo: true,
  })
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  const [depoimentoForm, setDepoimentoForm] = useState<any>({
    nome_cliente: '',
    texto: '',
    estrelas: 5,
    publicado: true,
  })
  const [depoimentoFile, setDepoimentoFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBanners()
    fetchDepoimentos()
  }, [])

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('site_banners')
      .select('*')
      .order('ordem', { ascending: true })
    if (data) setBanners(data)
  }

  const fetchDepoimentos = async () => {
    const { data } = await supabase
      .from('site_depoimentos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setDepoimentos(data)
  }

  const toggleDepoimento = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('site_depoimentos')
      .update({ publicado: !current })
      .eq('id', id)
    if (!error) fetchDepoimentos()
  }

  const deleteDepoimento = async (id: string) => {
    if (!confirm('Excluir este depoimento?')) return
    const { error } = await supabase.from('site_depoimentos').delete().eq('id', id)
    if (!error) fetchDepoimentos()
  }

  const toggleBanner = async (id: string, current: boolean) => {
    const { error } = await supabase.from('site_banners').update({ ativo: !current }).eq('id', id)
    if (!error) fetchBanners()
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Excluir este banner?')) return
    const { error } = await supabase.from('site_banners').delete().eq('id', id)
    if (!error) fetchBanners()
  }

  const handleSaveBanner = async () => {
    if (!bannerFile && !bannerForm.id)
      return toast({ title: 'Selecione uma imagem', variant: 'destructive' })
    setLoading(true)
    try {
      let imagem_url = bannerForm.imagem_url
      if (bannerFile) {
        const filePath = `banners/${Date.now()}_${bannerFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(filePath, bannerFile)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath)
        imagem_url = data.publicUrl
      }

      const payload = { ...bannerForm, imagem_url }
      if (payload.id) {
        await supabase.from('site_banners').update(payload).eq('id', payload.id)
      } else {
        await supabase.from('site_banners').insert(payload)
      }
      toast({ title: 'Banner salvo!' })
      setIsBannerModalOpen(false)
      fetchBanners()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDepoimento = async () => {
    if (!depoimentoForm.nome_cliente || !depoimentoForm.texto)
      return toast({ title: 'Preencha os dados obrigatórios', variant: 'destructive' })
    setLoading(true)
    try {
      let foto_url = depoimentoForm.foto_url
      if (depoimentoFile) {
        const filePath = `depoimentos/${Date.now()}_${depoimentoFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(filePath, depoimentoFile)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath)
        foto_url = data.publicUrl
      }

      const payload = { ...depoimentoForm, foto_url }
      if (payload.id) {
        await supabase.from('site_depoimentos').update(payload).eq('id', payload.id)
      } else {
        await supabase.from('site_depoimentos').insert(payload)
      }
      toast({ title: 'Depoimento salvo!' })
      setIsDepoimentoModalOpen(false)
      fetchDepoimentos()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Design & Marketing</h1>
        <p className="text-slate-500">
          Gerencie banners da home e depoimentos de clientes. (Para logotipos e cores, acesse o Hub
          / Branding).
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" /> Banners da Home
          </TabsTrigger>
          <TabsTrigger value="depoimentos" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Depoimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-6">
          <Card className="border-t-4 border-t-blue-600">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Banners Rotativos</CardTitle>
                <CardDescription>
                  Gerencie os banners de destaque na página inicial.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setBannerForm({
                    titulo: '',
                    texto: '',
                    botao_texto: '',
                    botao_link: '',
                    ordem: 0,
                    ativo: true,
                  })
                  setBannerFile(null)
                  setIsBannerModalOpen(true)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Banner
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map((b) => (
                  <div
                    key={b.id}
                    className={`rounded-xl border overflow-hidden relative group ${!b.ativo ? 'opacity-60' : ''}`}
                  >
                    <img
                      src={b.imagem_url}
                      alt={b.titulo}
                      className="w-full h-48 object-cover bg-slate-100"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge variant={b.ativo ? 'default' : 'secondary'}>
                        {b.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="p-4 bg-white">
                      <h4 className="font-bold text-lg">{b.titulo || 'Sem Título'}</h4>
                      <p className="text-sm text-slate-500 truncate">{b.texto || 'Sem Texto'}</p>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={b.ativo}
                            onCheckedChange={() => toggleBanner(b.id, b.ativo)}
                          />
                          <span className="text-xs font-medium text-slate-600">Visível</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setBannerForm(b)
                              setBannerFile(null)
                              setIsBannerModalOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => deleteBanner(b.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                    Nenhum banner cadastrado. Adicione o primeiro!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depoimentos" className="space-y-6">
          <Card className="border-t-4 border-t-purple-600">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Depoimentos de Clientes</CardTitle>
                <CardDescription>O que dizem sobre a loja.</CardDescription>
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  setDepoimentoForm({ nome_cliente: '', texto: '', estrelas: 5, publicado: true })
                  setDepoimentoFile(null)
                  setIsDepoimentoModalOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Depoimento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {depoimentos.length === 0 ? (
                  <p className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                    Nenhum depoimento encontrado.
                  </p>
                ) : (
                  depoimentos.map((dep) => (
                    <Card
                      key={dep.id}
                      className={`bg-slate-50/50 ${!dep.publicado ? 'opacity-60' : ''}`}
                    >
                      <CardContent className="p-4 flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0 overflow-hidden flex items-center justify-center font-bold text-slate-500 text-xl border-2 border-white shadow-sm">
                          {dep.foto_url ? (
                            <img
                              src={dep.foto_url}
                              alt={dep.nome_cliente}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            dep.nome_cliente?.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold flex items-center gap-2 truncate">
                            {dep.nome_cliente}
                          </p>
                          <div className="flex text-amber-500 my-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < dep.estrelas ? 'fill-current' : 'text-slate-300'}`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-slate-600 mt-1 italic truncate">
                            "{dep.texto}"
                          </p>
                        </div>
                        <div className="ml-auto flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Switch
                              checked={dep.publicado}
                              onCheckedChange={() => toggleDepoimento(dep.id, dep.publicado)}
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600"
                              onClick={() => {
                                setDepoimentoForm(dep)
                                setDepoimentoFile(null)
                                setIsDepoimentoModalOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteDepoimento(dep.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL BANNER */}
      <Dialog open={isBannerModalOpen} onOpenChange={setIsBannerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{bannerForm.id ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Imagem do Banner (Desktop 1920x600 aprox) *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
              />
              {bannerForm.imagem_url && !bannerFile && (
                <p className="text-xs text-blue-600">Imagem atual já enviada.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título (Opcional)</Label>
                <Input
                  value={bannerForm.titulo}
                  onChange={(e) => setBannerForm({ ...bannerForm, titulo: e.target.value })}
                  placeholder="Ex: Mega Feirão"
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={bannerForm.ordem}
                  onChange={(e) => setBannerForm({ ...bannerForm, ordem: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subtítulo / Texto (Opcional)</Label>
              <Input
                value={bannerForm.texto}
                onChange={(e) => setBannerForm({ ...bannerForm, texto: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Texto do Botão</Label>
                <Input
                  value={bannerForm.botao_texto}
                  onChange={(e) => setBannerForm({ ...bannerForm, botao_texto: e.target.value })}
                  placeholder="Ex: Ver Estoque"
                />
              </div>
              <div className="space-y-2">
                <Label>Link do Botão</Label>
                <Input
                  value={bannerForm.botao_link}
                  onChange={(e) => setBannerForm({ ...bannerForm, botao_link: e.target.value })}
                  placeholder="/estoque"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBannerModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBanner} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DEPOIMENTO */}
      <Dialog open={isDepoimentoModalOpen} onOpenChange={setIsDepoimentoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{depoimentoForm.id ? 'Editar Depoimento' : 'Novo Depoimento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Nome do Cliente *</Label>
                <Input
                  value={depoimentoForm.nome_cliente}
                  onChange={(e) =>
                    setDepoimentoForm({ ...depoimentoForm, nome_cliente: e.target.value })
                  }
                />
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Estrelas</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={depoimentoForm.estrelas}
                  onChange={(e) =>
                    setDepoimentoForm({ ...depoimentoForm, estrelas: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Foto do Cliente (Opcional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setDepoimentoFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto do Depoimento *</Label>
              <Input
                value={depoimentoForm.texto}
                onChange={(e) => setDepoimentoForm({ ...depoimentoForm, texto: e.target.value })}
                placeholder="Comprei meu carro e recomendo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDepoimentoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDepoimento} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Depoimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
