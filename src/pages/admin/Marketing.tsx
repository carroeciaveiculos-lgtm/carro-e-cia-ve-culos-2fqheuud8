import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, BarChart3, MessageCircle } from 'lucide-react'
import { WhatsAppScheduler } from '@/components/admin/marketing/WhatsAppScheduler'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

// A aba "Redes Sociais" que existia aqui foi removida em 20/08/2026 — devia
// ter saído quando a Central de Redes Sociais foi criada em 14/08/2026 (o
// comentário em CentralSocial.tsx já dizia que ela unificava "a aba 'social'
// dentro de Marketing", mas essa aba nunca chegou a ser apagada). Formulário
// duplicado criava posts com `redes` em formato diferente (array, incluindo
// uma opção "google" que nunca teve implementação nenhuma em
// publicar-social) e um "Painel de Aprovação" que já era o mesmo componente
// da aba Aprovações da Central. Criar/agendar post social agora só existe em
// /admin/central-social — ver RedesSociais.tsx pro seletor de formato
// Feed/Stories/Reels que foi pra lá.
export default function Marketing() {
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: logsData } = await supabase
      .from('marketing_logs')
      .select('*')
      .order('created_at', { ascending: true })
    if (logsData) setLogs(logsData)
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
          Gerencie automações de e-mail via WhatsApp e acompanhe métricas. Pra criar ou agendar
          post social, use a Central de Redes Sociais.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border rounded-lg p-1 h-auto flex flex-wrap shadow-sm">
          <TabsTrigger
            value="whatsapp"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics & Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <WhatsAppScheduler />
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
