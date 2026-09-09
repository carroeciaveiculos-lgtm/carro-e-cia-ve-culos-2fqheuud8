import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Save, Share2, Facebook, Instagram, MessageCircle, Phone, MapPin } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContactsConfigPanel } from '@/components/admin/ContactsConfigPanel'
import { StoreSeoConfigPanel } from '@/components/admin/StoreSeoConfigPanel'

export default function Configuracoes() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('contatos')
  const [socialConfig, setSocialConfig] = useState<any>({
    id: null,
    instagram_token: '',
    facebook_page_id: '',
    facebook_token: '',
    whatsapp_number: '',
    ai_system_prompt: '',
  })

  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    const { data: socialData } = await supabase
      .from('social_configuracoes')
      .select('*')
      .limit(1)
      .single()
    if (socialData) {
      setSocialConfig(socialData)
    }
  }

  const handleSaveSocial = async () => {
    setLoading(true)
    try {
      if (socialConfig.id) {
        const { error } = await supabase
          .from('social_configuracoes')
          .update(socialConfig)
          .eq('id', socialConfig.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('social_configuracoes')
          .insert([socialConfig])
          .select()
          .single()
        if (error) throw error
        if (data) setSocialConfig(data)
      }
      toast({ title: 'Configurações salvas com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Configurações do Sistema</h1>
        <p className="text-slate-500">
          Gerencie dados da loja, SEO global, scripts de rastreamento e integrações.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="contatos" className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> Contatos
          </TabsTrigger>
          <TabsTrigger value="loja-seo" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Loja & SEO
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contatos" className="space-y-6">
          <ContactsConfigPanel />
        </TabsContent>

        <TabsContent value="loja-seo" className="space-y-6">
          <StoreSeoConfigPanel />
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" /> Integrações de APIs & Sociais
              </CardTitle>
              <CardDescription>
                Configure os tokens para automações de redes sociais e APIs externas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" /> System Prompt da IA
                    (Legado)
                  </Label>
                  <Textarea
                    value={socialConfig.ai_system_prompt || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, ai_system_prompt: e.target.value })
                    }
                    placeholder="Ex: Você é um assistente de marketing experiente focado em venda de seminovos..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-slate-500">
                    Nota: Migre suas configurações de IA para a tela "Regras de IA" (menu
                    lateral).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" /> Token Instagram
                  </Label>
                  <Input
                    type="password"
                    value={socialConfig.instagram_token || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, instagram_token: e.target.value })
                    }
                    placeholder="IGQ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" /> ID da Página Facebook
                  </Label>
                  <Input
                    value={socialConfig.facebook_page_id || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, facebook_page_id: e.target.value })
                    }
                    placeholder="123456789..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" /> Token da Página (Page Access
                    Token)
                  </Label>
                  <Input
                    type="password"
                    value={socialConfig.facebook_token || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, facebook_token: e.target.value })
                    }
                    placeholder="EAA..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" /> Número do WhatsApp (WA.ME)
                  </Label>
                  <Input
                    value={socialConfig.whatsapp_number || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, whatsapp_number: e.target.value })
                    }
                    placeholder="Ex: 5534999999999"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t mt-6">
                <Button
                  onClick={handleSaveSocial}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" /> Salvar Integrações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
