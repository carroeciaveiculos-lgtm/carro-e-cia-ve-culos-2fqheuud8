import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Image as ImageIcon, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MediaSelectorModal({ open, onOpenChange, onSelect }: any) {
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      Promise.all([
        supabase
          .from('veiculos')
          .select('id, marca, modelo, fotos')
          .not('fotos', 'is', null)
          .limit(20)
          .order('created_at', { ascending: false }),
        supabase
          .from('media_assets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]).then(([resVeiculos, resAssets]) => {
        if (resVeiculos.data) setVeiculos(resVeiculos.data)
        if (resAssets.data) setAssets(resAssets.data)
        setLoading(false)
      })
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Gerenciador de Mídia</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stock" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 border-b">
            <TabsList>
              <TabsTrigger value="stock">
                <Car className="w-4 h-4 mr-2" /> Imagens de Estoque
              </TabsTrigger>
              <TabsTrigger value="assets">
                <ImageIcon className="w-4 h-4 mr-2" /> Biblioteca de Mídia
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stock" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-[500px] p-6">
              {loading ? (
                <div className="text-center text-slate-500 py-8">Carregando...</div>
              ) : (
                <div className="space-y-8">
                  {veiculos.map((v) => {
                    const fotos = v.fotos || []
                    if (!fotos.length) return null
                    return (
                      <div key={v.id}>
                        <h4 className="font-bold text-sm mb-3 text-slate-700">
                          {v.marca} {v.modelo}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {fotos.map((url: string, i: number) => (
                            <div
                              key={i}
                              className="relative group cursor-pointer border rounded-lg overflow-hidden bg-slate-100"
                              onClick={() => onSelect(url)}
                            >
                              <img
                                src={url}
                                alt={`${v.modelo} ${i}`}
                                className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="pointer-events-none"
                                >
                                  Selecionar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {!veiculos.length && (
                    <div className="text-center text-slate-500 py-8">
                      Nenhum veículo com fotos encontrado.
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="assets" className="flex-1 min-h-0 m-0">
            <ScrollArea className="h-[500px] p-6">
              {loading ? (
                <div className="text-center text-slate-500 py-8">Carregando...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="relative group cursor-pointer border rounded-lg overflow-hidden bg-slate-100"
                      onClick={() => onSelect(asset.file_path)}
                    >
                      <img
                        src={asset.file_path}
                        alt={asset.alt_text || asset.file_name}
                        className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" className="pointer-events-none">
                          Selecionar
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!assets.length && (
                    <div className="col-span-full text-center text-slate-500 py-8">
                      Nenhuma imagem na biblioteca.
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
