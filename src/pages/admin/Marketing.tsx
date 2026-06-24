import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Activity, Mail, Share2, BarChart3, Plus } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

export default function Marketing() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('social')
  const [logs, setLogs] = useState<any[]>([])
  const [automations, setAutomations] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])

  const [postText, setPostText] = useState('')
  const [postImage, setPostImage] = useState('')
  const [postDate, setPostDate] = useState('')
  const [postPlatforms, setPostPlatforms] = useState<string[]>(['instagram'])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: logsData } = await supabase
      .from('marketing_logs')
      .select('*')
      .order('created_at', { ascending: true })
    if (logsData) setLogs(logsData)

    setAutomations([
      { id: 1, nome: 'Boas-vindas (Novo Lead)', tipo: 'email', ativo: true, envios: 145 },
      {
        id: 2,
        nome: 'Recuperação de Carrinho (Avaliação)',
        tipo: 'email',
        ativo: false,
        envios: 32,
      },
      { id: 3, nome: 'Feliz Aniversário', tipo: 'email', ativo: true, envios: 89 },
    ])

    const { data: postsData } = await supabase
      .from('social_posts')
      .select('*, veiculos(marca, modelo)')
      .order('criado_em', { ascending: false })
    if (postsData) setPosts(postsData)
  }

  const toggleAutomation = (id: number) => {
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, ativo: !a.ativo } : a)))
    toast({ title: 'Status atualizado', description: 'Automação alterada com sucesso.' })
  }

  const handleSchedulePost = async () => {
    if (!postText || !postDate || postPlatforms.length === 0) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (postText.length > 2200 && postPlatforms.includes('instagram')) {
      toast({
        title: 'Aviso',
        description: 'Instagram permite no máximo 2200 caracteres.',
        variant: 'destructive',
      })
      return
    }

    const { error } = await supabase.from('social_posts').insert({
      texto: postText,
      imagem: postImage,
      data_agendamento: new Date(postDate).toISOString(),
      redes: postPlatforms,
      status: 'Agendado',
    })

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Post agendado com sucesso!' })
      setPostText('')
      setPostImage('')
      setPostDate('')
      loadData()
    }
  }

  const emailData = logs
    .filter((l) => l.tipo === 'email')
    .reduce((acc, log) => {
      const date = new Date(log.created_at).toLocaleDateString()
      const existing = acc.find((a: any) => a.date === date)
      if (existing) {
        existing.sent += 1
        if (log.detalhes?.opened) existing.opened += 1
      } else {
        acc.push({ date, sent: 1, opened: log.detalhes?.opened ? 1 : 0 })
      }
      return acc
    }, [])

  const socialData = logs
    .filter((l) => l.tipo === 'social_post')
    .reduce((acc, log) => {
      const date = new Date(log.created_at).toLocaleDateString()
      const existing = acc.find((a: any) => a.date === date)
      if (existing) {
        existing.engagement += (log.detalhes?.likes || 0) + (log.detalhes?.comments || 0)
      } else {
        acc.push({ date, engagement: (log.detalhes?.likes || 0) + (log.detalhes?.comments || 0) })
      }
      return acc
    }, [])

  const emailConfig = {
    sent: { label: 'Enviados', color: 'hsl(var(--chart-1))' },
    opened: { label: 'Abertos', color: 'hsl(var(--chart-2))' },
  }

  const socialConfig = {
    engagement: { label: 'Engajamento', color: 'hsl(var(--chart-3))' },
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" /> Dashboard de Marketing
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie automações de e-mail, agende postagens sociais e acompanhe métricas.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border rounded-lg p-1 h-auto flex flex-wrap shadow-sm">
          <TabsTrigger
            value="social"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Share2 className="w-4 h-4 mr-2" /> Redes Sociais
          </TabsTrigger>
          <TabsTrigger
            value="emails"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Mail className="w-4 h-4 mr-2" /> Automações de E-mail
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics & Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Agendador de Postagens</CardTitle>
              <CardDescription>
                Crie e agende postagens para Facebook, Instagram e Google Meu Negócio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label>Plataformas</Label>
                <div className="flex gap-4">
                  {['instagram', 'facebook', 'google'].map((plat) => (
                    <label key={plat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={postPlatforms.includes(plat)}
                        onChange={(e) => {
                          if (e.target.checked) setPostPlatforms([...postPlatforms, plat])
                          else setPostPlatforms(postPlatforms.filter((p) => p !== plat))
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize text-sm font-medium">{plat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texto da Postagem</Label>
                <Textarea
                  rows={5}
                  placeholder="Escreva a legenda do seu post aqui..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
                <p className="text-xs text-slate-500 text-right">{postText.length} caracteres</p>
              </div>

              <div className="space-y-2">
                <Label>URL da Imagem</Label>
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={postImage}
                  onChange={(e) => setPostImage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data e Hora do Agendamento</Label>
                <Input
                  type="datetime-local"
                  value={postDate}
                  onChange={(e) => setPostDate(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSchedulePost}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Agendar Postagem
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Postagens Programadas e Rascunhos</CardTitle>
              <CardDescription>Posts gerados pela IA ou enviados do Estoque.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex gap-4 p-4 border rounded-lg bg-slate-50 items-start"
                  >
                    {post.imagem && (
                      <div className="w-20 h-20 bg-slate-200 rounded-md overflow-hidden shrink-0">
                        <img src={post.imagem} alt="Post" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${post.status === 'Agendado' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}
                        >
                          {post.status}
                        </span>
                        <div className="flex gap-1">
                          {post.redes?.map((r: string) => (
                            <span key={r} className="text-xs text-slate-500 uppercase">
                              {r}
                            </span>
                          ))}
                        </div>
                        {post.veiculos && (
                          <span className="text-xs text-purple-600 font-medium ml-auto">
                            Veículo: {post.veiculos.marca} {post.veiculos.modelo}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">{post.texto}</p>
                      {post.data_agendamento && (
                        <p className="text-xs text-slate-500 mt-2">
                          Agendado para: {new Date(post.data_agendamento).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <p className="text-center text-slate-500 py-4">Nenhum post encontrado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Sequências de Lead Nurturing</CardTitle>
              <CardDescription>
                Ative ou desative réguas de e-mails automatizados para sua base de contatos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automations.map((auto) => (
                  <div
                    key={auto.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-slate-50"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800">{auto.nome}</h4>
                      <p className="text-sm text-slate-500">
                        {auto.envios} leads na sequência atual
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${auto.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}
                      >
                        {auto.ativo ? 'Ativa' : 'Pausada'}
                      </span>
                      <Switch
                        checked={auto.ativo}
                        onCheckedChange={() => toggleAutomation(auto.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance de E-mails</CardTitle>
                <CardDescription>Envios vs Aberturas (Últimos dias)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={emailConfig} className="h-[300px] w-full">
                  <BarChart data={emailData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="sent" fill="var(--color-sent)" radius={4} />
                    <Bar dataKey="opened" fill="var(--color-opened)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engajamento Social</CardTitle>
                <CardDescription>Interações (Curtidas + Comentários) por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={socialConfig} className="h-[300px] w-full">
                  <LineChart data={socialData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      stroke="var(--color-engagement)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
