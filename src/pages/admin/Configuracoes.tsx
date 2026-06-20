import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Save, Share2, Facebook, Instagram, MessageCircle, BrainCircuit } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Configuracoes() {
  const [loading, setLoading] = useState(false)
  const [socialConfig, setSocialConfig] = useState<any>({
    id: null,
    instagram_token: '',
    facebook_page_id: '',
    facebook_token: '',
    whatsapp_number: '',
    ai_system_prompt: '',
  })

  const [brainConfig, setBrainConfig] = useState<any>({
    base_conhecimento: '',
    diretrizes_marca: '',
    glossario: '',
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

    const { data: brainData } = await supabase
      .from('site_configuracoes')
      .select('valor')
      .eq('chave', 'brain_ia_settings')
      .maybeSingle()
    if (brainData?.valor) {
      setBrainConfig(brainData.valor)
    }
  }

  const handleSaveBrain = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('site_configuracoes')
        .upsert({ chave: 'brain_ia_settings', valor: brainConfig }, { onConflict: 'chave' })
      if (error) throw error
      toast({ title: 'Configurações Brain IA salvas com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar Brain IA', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
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
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Configurações do Sistema</h1>
        <p className="text-slate-500">
          Gerencie as integrações, Brain IA e chaves do painel administrativo.
        </p>
      </div>

      <Tabs defaultValue="brain" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="brain" className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> Brain IA
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Integrações Sociais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brain">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-amber-600" /> Brain IA - Conhecimento
              </CardTitle>
              <CardDescription>
                Treine o "Cérebro" da IA com textos padrão, diretrizes de marca e glossário para
                geração de conteúdo perfeita.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Base de Conhecimento (Textos "Padrão Ouro")</Label>
                <Textarea
                  value={brainConfig.base_conhecimento || ''}
                  onChange={(e) =>
                    setBrainConfig({ ...brainConfig, base_conhecimento: e.target.value })
                  }
                  placeholder="Cole aqui textos, artigos e referências de como a Carro e Cia gosta de escrever..."
                  className="min-h-[150px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Diretrizes da Marca</Label>
                <Textarea
                  value={brainConfig.diretrizes_marca || ''}
                  onChange={(e) =>
                    setBrainConfig({ ...brainConfig, diretrizes_marca: e.target.value })
                  }
                  placeholder="Regras de comunicação, tom de voz, gatilhos mentais obrigatórios..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Glossário e Termos Técnicos</Label>
                <Textarea
                  value={brainConfig.glossario || ''}
                  onChange={(e) => setBrainConfig({ ...brainConfig, glossario: e.target.value })}
                  placeholder="Ex: Troca com Troco: quando o cliente dá um carro de maior valor e sai com um de menor e dinheiro no bolso..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end pt-4 border-t mt-6">
                <Button
                  onClick={handleSaveBrain}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Save className="w-4 h-4 mr-2" /> Salvar Brain IA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" /> Integrações Sociais (Automação IA)
              </CardTitle>
              <CardDescription>
                Configure os tokens para permitir postagens automáticas geradas pela IA diretamente
                no Feed e Stories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" /> System Prompt da IA (Tom
                    de Voz)
                  </Label>
                  <Textarea
                    value={socialConfig.ai_system_prompt || ''}
                    onChange={(e) =>
                      setSocialConfig({ ...socialConfig, ai_system_prompt: e.target.value })
                    }
                    placeholder="Ex: Você é um assistente de marketing experiente focado em venda de seminovos..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" /> Token Instagram (Long-Lived)
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
                  <p className="text-xs text-slate-500">
                    Este número será usado para os botões "Fale Conosco" gerados pela IA.
                  </p>
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
