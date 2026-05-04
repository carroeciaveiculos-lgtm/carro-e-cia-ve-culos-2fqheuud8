import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Save, Loader2, Code2, AlertCircle } from 'lucide-react'

export default function ScriptsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [scripts, setScripts] = useState({
    ga_id: '',
    gtm_id: '',
    facebook_pixel_id: '',
    custom_head: '',
    custom_body: '',
  })

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const { data, error } = await supabase
          .from('site_configuracoes')
          .select('valor')
          .eq('chave', 'scripts_seo')
          .single()

        if (data && data.valor) {
          setScripts((prev) => ({ ...prev, ...(data.valor as any) }))
        }
      } catch (err) {
        console.error('Error fetching scripts', err)
      } finally {
        setFetching(false)
      }
    }
    fetchScripts()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setScripts((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('site_configuracoes')
        .upsert({ chave: 'scripts_seo', valor: scripts }, { onConflict: 'chave' })

      if (error) throw error

      toast({
        title: 'Scripts Atualizados!',
        description: 'Suas alterações foram injetadas no site.',
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
        <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Gestor de Scripts e Monitoramento</h1>
        <p className="mt-2 text-gray-500">
          Configure IDs de rastreamento e injete códigos no site sem a necessidade de editar código
          fonte.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 text-yellow-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-yellow-600" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Atenção ao adicionar códigos personalizados</p>
          <p>
            Tags inseridas incorretamente podem afetar a renderização ou velocidade do seu site.
            Cole exatamente o que foi fornecido pelo serviço (ex: script tags completas).
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-t-4 border-t-[#2563eb] shadow-sm">
          <CardHeader>
            <CardTitle>IDs de Rastreamento Nativos</CardTitle>
            <CardDescription>
              Insira apenas os identificadores (IDs). O sistema monta e otimiza a injeção do script
              automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ga_id" className="font-semibold text-gray-700">
                Google Analytics 4 (Measurement ID)
              </Label>
              <Input
                id="ga_id"
                name="ga_id"
                value={scripts.ga_id}
                onChange={handleChange}
                placeholder="Ex: G-12345ABCDE"
                className="font-mono bg-gray-50 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gtm_id" className="font-semibold text-gray-700">
                Google Tag Manager ID
              </Label>
              <Input
                id="gtm_id"
                name="gtm_id"
                value={scripts.gtm_id}
                onChange={handleChange}
                placeholder="Ex: GTM-XXXXXXX"
                className="font-mono bg-gray-50 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_pixel_id" className="font-semibold text-gray-700">
                Meta / Facebook Pixel ID
              </Label>
              <Input
                id="facebook_pixel_id"
                name="facebook_pixel_id"
                value={scripts.facebook_pixel_id}
                onChange={handleChange}
                placeholder="Ex: 123456789012345"
                className="font-mono bg-gray-50 focus-visible:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#1A1A1A] shadow-sm">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Code2 className="w-5 h-5 text-gray-400" />
              Injeção de Código Avançado
            </CardTitle>
            <CardDescription>
              Cole tags inteiras (incluindo &lt;script&gt;) para chatbots, pixels de terceiros, ou
              meta-tags de verificação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="custom_head" className="font-semibold text-gray-700 text-base">
                Tags para o final do &lt;head&gt;
              </Label>
              <p className="text-xs text-gray-500">
                Ideal para verificadores de domínio (Google Search Console), pré-load de fontes ou
                estilos globais.
              </p>
              <Textarea
                id="custom_head"
                name="custom_head"
                value={scripts.custom_head}
                onChange={handleChange}
                placeholder="<!-- Seus scripts de head aqui -->"
                className="font-mono text-sm min-h-[160px] bg-slate-900 text-slate-100 placeholder:text-slate-500 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-dashed">
              <Label htmlFor="custom_body" className="font-semibold text-gray-700 text-base">
                Tags para o final do &lt;body&gt;
              </Label>
              <p className="text-xs text-gray-500">
                Ideal para widgets de chat (Zendesk, Tawk.to), popups, ou scripts que não devem
                bloquear o carregamento visual inicial.
              </p>
              <Textarea
                id="custom_body"
                name="custom_body"
                value={scripts.custom_body}
                onChange={handleChange}
                placeholder="<!-- Seus scripts de body aqui -->"
                className="font-mono text-sm min-h-[160px] bg-slate-900 text-slate-100 placeholder:text-slate-500 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#1A1A1A] hover:bg-black text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Salvar Injeções de Código
        </Button>
      </div>
    </div>
  )
}
