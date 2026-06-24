import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, ImageIcon, MessageSquare, Trash2, LayoutTemplate } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

export default function Design() {
  const [activeTab, setActiveTab] = useState('banners')
  const [depoimentos, setDepoimentos] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (activeTab === 'depoimentos') {
      fetchDepoimentos()
    }
  }, [activeTab])

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

  const partnerLogos = [
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Bradesco.png',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/BV.png',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/PORTO%20BANK%20LOGO.png',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Safra.jpeg',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/santander.png',
  ]

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Design & Mídias</h1>
        <p className="text-slate-500">
          Gerencie banners, logotipos, imagens do site e depoimentos de clientes.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" /> Banners
          </TabsTrigger>
          <TabsTrigger value="logos" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Logos & Fachada
          </TabsTrigger>
          <TabsTrigger value="depoimentos" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Depoimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Banners da Home</CardTitle>
              <CardDescription>
                Adicione ou edite os banners rotativos da página inicial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="overflow-hidden relative group">
                  <img
                    src="https://img.usecurling.com/p/800/400?q=cars&color=red"
                    alt="Banner 1"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <Button size="sm" variant="secondary">
                      Editar Imagem
                    </Button>
                  </div>
                </Card>
                <Card className="flex items-center justify-center h-48 border-dashed border-2 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="text-center text-slate-500">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <span className="text-sm font-medium">Novo Banner</span>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Logos e Fachada</CardTitle>
                <CardDescription>Gerencie a identidade visual da loja.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border p-4 rounded-lg text-center">
                  <img
                    src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/logos/logo%20carro%20e%20cia.png"
                    className="h-24 mx-auto object-contain mb-2"
                    alt="Logo"
                  />
                  <p className="text-sm text-slate-500 mb-2">Logo Principal</p>
                  <Button variant="outline" size="sm">
                    Atualizar Logo
                  </Button>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <img
                    src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg"
                    className="h-32 mx-auto object-cover rounded mb-2 w-full"
                    alt="Fachada"
                  />
                  <p className="text-sm text-slate-500 mb-2">Foto da Fachada</p>
                  <Button variant="outline" size="sm">
                    Atualizar Fachada
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bancos Parceiros</CardTitle>
                <CardDescription>Logos das financeiras exibidas no rodapé/home.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {partnerLogos.map((url, i) => (
                    <div
                      key={i}
                      className="w-24 h-16 border rounded-lg p-2 flex items-center justify-center bg-slate-50 relative group"
                    >
                      <img
                        src={url}
                        alt="Partner Logo"
                        className="max-w-full max-h-full object-contain mix-blend-multiply"
                      />
                      <button className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="w-24 h-16 border border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400 text-xs text-center p-2">
                    <Plus className="w-4 h-4 mx-auto mb-1" />
                    Adicionar
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="depoimentos" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Depoimentos de Clientes</CardTitle>
                <CardDescription>O que dizem sobre a Carro e Cia.</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  toast({ title: 'Adicionar depoimento', description: 'Em desenvolvimento' })
                }
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Depoimento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {depoimentos.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">Nenhum depoimento encontrado.</p>
                ) : (
                  depoimentos.map((dep) => (
                    <Card key={dep.id} className="bg-slate-50/50">
                      <CardContent className="p-4 flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0 overflow-hidden flex items-center justify-center font-bold text-slate-500">
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
                        <div className="flex-1">
                          <p className="font-bold flex items-center gap-2">
                            {dep.nome_cliente}
                            <Badge
                              variant={dep.publicado ? 'default' : 'secondary'}
                              className="text-[10px] h-5"
                            >
                              {dep.publicado ? 'Visível no Site' : 'Oculto'}
                            </Badge>
                          </p>
                          <p className="text-sm text-slate-600 mt-1">"{dep.texto}"</p>
                        </div>
                        <div className="ml-auto flex flex-col items-end gap-2">
                          <div className="text-amber-500 font-bold whitespace-nowrap text-sm">
                            {'★'.repeat(dep.estrelas || 5)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleDepoimento(dep.id, dep.publicado)}
                            >
                              {dep.publicado ? 'Ocultar' : 'Publicar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
    </div>
  )
}
