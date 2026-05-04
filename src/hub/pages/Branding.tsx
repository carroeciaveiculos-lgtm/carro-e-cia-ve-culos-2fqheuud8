import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Save, Loader2 } from 'lucide-react'

export default function BrandingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [branding, setBranding] = useState({
    logo_url: '',
    favicon_url: '',
    primary_color: '#CC0000',
    secondary_color: '#1A1A1A',
  })

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('site_configuracoes')
          .select('valor')
          .eq('chave', 'branding')
          .single()

        if (data && data.valor) {
          setBranding((prev) => ({ ...prev, ...(data.valor as any) }))
        }
      } catch (err) {
        console.error('Error fetching branding', err)
      } finally {
        setFetching(false)
      }
    }
    fetchBranding()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBranding((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('site_configuracoes')
        .upsert({ chave: 'branding', valor: branding }, { onConflict: 'chave' })

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: 'As configurações de branding foram salvas.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#CC0000]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Branding e Identidade</h1>
        <p className="mt-2 text-gray-500">
          Configure as informações visuais globais do seu site em tempo real.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-t-4 border-t-[#CC0000] shadow-sm">
          <CardHeader>
            <CardTitle>Logotipos e Ícones</CardTitle>
            <CardDescription>
              Imagens oficiais usadas no cabeçalho, rodapé e guias do navegador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo_url" className="font-semibold text-gray-700">
                URL do Logo Principal
              </Label>
              <div className="flex gap-4">
                <Input
                  id="logo_url"
                  name="logo_url"
                  value={branding.logo_url}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/logo.png"
                  className="bg-gray-50 focus-visible:ring-[#CC0000]"
                />
              </div>
              {branding.logo_url && (
                <div className="mt-4 p-6 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center h-32 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                  <img
                    src={branding.logo_url}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain relative z-10"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="favicon_url" className="font-semibold text-gray-700">
                URL do Favicon
              </Label>
              <Input
                id="favicon_url"
                name="favicon_url"
                value={branding.favicon_url}
                onChange={handleChange}
                placeholder="https://exemplo.com/favicon.ico"
                className="bg-gray-50 focus-visible:ring-[#CC0000]"
              />
              {branding.favicon_url && (
                <div className="mt-3 flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                  <img
                    src={branding.favicon_url}
                    alt="Favicon Preview"
                    className="w-5 h-5 object-contain"
                  />
                  <span>Este ícone aparecerá na aba do navegador dos usuários.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#1A1A1A] shadow-sm">
          <CardHeader>
            <CardTitle>Paleta de Cores</CardTitle>
            <CardDescription>
              Defina as cores principais do tema do site e do painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="primary_color" className="font-semibold text-gray-700">
                  Cor Primária (Principal)
                </Label>
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <Input
                      type="color"
                      id="primary_color"
                      name="primary_color"
                      value={branding.primary_color}
                      onChange={handleChange}
                      className="w-14 h-14 p-1 cursor-pointer border-gray-300 rounded-lg"
                    />
                  </div>
                  <Input
                    type="text"
                    value={branding.primary_color}
                    onChange={handleChange}
                    name="primary_color"
                    className="uppercase font-mono tracking-wider flex-1 focus-visible:ring-[#CC0000]"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Usado em botões de destaque, links ativos e detalhes.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="secondary_color" className="font-semibold text-gray-700">
                  Cor Secundária (Textos/Fundo Escuro)
                </Label>
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <Input
                      type="color"
                      id="secondary_color"
                      name="secondary_color"
                      value={branding.secondary_color}
                      onChange={handleChange}
                      className="w-14 h-14 p-1 cursor-pointer border-gray-300 rounded-lg"
                    />
                  </div>
                  <Input
                    type="text"
                    value={branding.secondary_color}
                    onChange={handleChange}
                    name="secondary_color"
                    className="uppercase font-mono tracking-wider flex-1 focus-visible:ring-[#1A1A1A]"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Usado em rodapés, barras superiores e textos densos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#CC0000] hover:bg-[#a30000] text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
