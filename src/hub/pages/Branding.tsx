import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Save, Loader2, UploadCloud } from 'lucide-react'

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
        const { data } = await supabase
          .from('site_configuracoes')
          .select('valor')
          .eq('chave', 'branding')
          .single()
        if (data && data.valor) {
          setBranding((prev) => ({ ...prev, ...(data.valor as any) }))
        }
      } catch {
        /* intentionally ignored */
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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'favicon_url',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const filePath = `branding/${Date.now()}_${file.name}`
      const { error } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath)
      setBranding((prev) => ({ ...prev, [field]: data.publicUrl }))
      toast({ title: 'Imagem enviada com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao enviar imagem', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('site_configuracoes')
        .upsert({ chave: 'branding', valor: branding }, { onConflict: 'chave' })
      if (error) throw error
      toast({ title: 'Configurações de branding salvas.' })
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (fetching)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#CC0000]" />
      </div>
    )

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Branding e Identidade</h1>
        <p className="mt-2 text-gray-500">
          Configure o logotipo global, favicon e cores principais do site.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-t-4 border-t-[#CC0000] shadow-sm">
          <CardHeader>
            <CardTitle>Logotipos e Ícones</CardTitle>
            <CardDescription>Imagens oficiais hospedadas no Supabase Storage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Logo Principal</Label>
              <div className="flex gap-4 items-center">
                <Input
                  value={branding.logo_url}
                  onChange={handleChange}
                  name="logo_url"
                  className="flex-1 bg-gray-50"
                  placeholder="URL da Imagem"
                />
                <div className="relative">
                  <Button variant="outline" disabled={loading}>
                    <UploadCloud className="w-4 h-4 mr-2" /> Upload
                  </Button>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo_url')}
                  />
                </div>
              </div>
              {branding.logo_url && (
                <div className="mt-4 p-6 border rounded-lg bg-gray-50 flex items-center justify-center h-32">
                  <img
                    src={branding.logo_url}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label className="font-semibold text-gray-700">Favicon</Label>
              <div className="flex gap-4 items-center">
                <Input
                  value={branding.favicon_url}
                  onChange={handleChange}
                  name="favicon_url"
                  className="flex-1 bg-gray-50"
                  placeholder="URL do Ícone"
                />
                <div className="relative">
                  <Button variant="outline" disabled={loading}>
                    <UploadCloud className="w-4 h-4 mr-2" /> Upload
                  </Button>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".ico,.png,.svg"
                    onChange={(e) => handleFileUpload(e, 'favicon_url')}
                  />
                </div>
              </div>
              {branding.favicon_url && (
                <div className="mt-3 flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                  <img
                    src={branding.favicon_url}
                    alt="Favicon"
                    className="w-5 h-5 object-contain"
                  />
                  <span>Ícone da aba do navegador.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#1A1A1A] shadow-sm">
          <CardHeader>
            <CardTitle>Paleta de Cores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label>Cor Primária</Label>
                <div className="flex gap-3">
                  <Input
                    type="color"
                    name="primary_color"
                    value={branding.primary_color}
                    onChange={handleChange}
                    className="w-14 h-14 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    name="primary_color"
                    value={branding.primary_color}
                    onChange={handleChange}
                    className="uppercase font-mono flex-1"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Cor Secundária</Label>
                <div className="flex gap-3">
                  <Input
                    type="color"
                    name="secondary_color"
                    value={branding.secondary_color}
                    onChange={handleChange}
                    className="w-14 h-14 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    name="secondary_color"
                    value={branding.secondary_color}
                    onChange={handleChange}
                    className="uppercase font-mono flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#CC0000] hover:bg-[#a30000] text-white px-8 py-6 text-lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}{' '}
          Salvar Branding
        </Button>
      </div>
    </div>
  )
}
