import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { ModuleCard } from '@/components/admin/ModuleCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Car,
  Target,
  Monitor,
  Banknote,
  FileText,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CameraOff,
  Settings,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

const ALL_MODULES = [
  { id: 'estoque', icon: Car, line1: 'Estoque e', line2: 'Integrador', route: '/admin/estoque' },
  { id: 'crm', icon: Target, line1: 'Gerenciador', line2: 'de Leads', route: '/admin/crm' },
  { id: 'site', icon: Monitor, line1: 'Gerenciador', line2: 'do Site', route: '/admin/conteudo' },
  {
    id: 'financiamento',
    icon: Banknote,
    line1: 'Simulador de',
    line2: 'Financiamentos',
    route: '/admin/financiamento',
  },
  {
    id: 'administrativo',
    icon: FileText,
    line1: 'Administrativo',
    line2: 'e NFs',
    route: '/admin/administrativo',
  },
  {
    id: 'marketing',
    icon: Activity,
    line1: 'Marketing e',
    line2: 'Automações',
    route: '/admin/marketing',
  },
  {
    id: 'configuracoes',
    icon: Settings,
    line1: 'Configurações',
    line2: 'Sistema e IA',
    route: '/admin/configuracoes',
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [userModules, setUserModules] = useState<string[]>([])

  const [metrics, setMetrics] = useState({
    leadsPendentes: 0,
    leadsAndamento: 0,
    leadsConvertidos: 0,
    estoqueTotal: 0,
    estoqueSemFoto: 0,
    estoqueParado: 0,
    totalLeads: 0,
    pagesPublished: 0,
  })

  const [funnelData, setFunnelData] = useState<any[]>([])

  interface SyncSummaryRow {
    platform: string
    nome: string
    cor: string | null
    ultimaSincronizacao: string | null
    sucessos24h: number
    erros24h: number
  }
  const [syncSummary, setSyncSummary] = useState<SyncSummaryRow[]>([])

  const loadSyncSummary = async () => {
    // Últimas sincronizações por plataforma (12/08/2026) — mesma fonte
    // (sync_log) usada no log em acordeão da tela Portais.
    const { data: plataformas } = await supabase
      .from('plataformas')
      .select('id, slug, nome, cor')
      .eq('ativo', true)
    if (!plataformas || plataformas.length === 0) return

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const rows: SyncSummaryRow[] = []
    for (const p of plataformas) {
      const [{ data: ultimo }, { count: sucessos }, { count: erros }] = await Promise.all([
        supabase
          .from('sync_log')
          .select('created_at')
          .eq('plataforma_id', p.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('sync_log')
          .select('id', { count: 'exact', head: true })
          .eq('plataforma_id', p.id)
          .eq('status', 'success')
          .gte('created_at', since),
        supabase
          .from('sync_log')
          .select('id', { count: 'exact', head: true })
          .eq('plataforma_id', p.id)
          .eq('status', 'erro')
          .gte('created_at', since),
      ])
      rows.push({
        platform: p.slug,
        nome: p.nome,
        cor: p.cor,
        ultimaSincronizacao: ultimo?.created_at || null,
        sucessos24h: sucessos || 0,
        erros24h: erros || 0,
      })
    }
    setSyncSummary(rows)
  }

  useEffect(() => {
    if (user) {
      supabase
        .from('usuarios')
        .select('nome, modulos')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserName(data.nome)
            setUserModules(data.modulos || [])
          }
        })

      loadMetrics()
      loadSyncSummary()
    }
  }, [user])

  const loadMetrics = async () => {
    // Leads Pendentes
    const { count: countPendentes } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .in('status', ['novo', 'Pendente', 'pendente'])

    // Leads em Andamento
    const { count: countAndamento } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .in('status', ['em_contato', 'negociando'])

    // Leads Convertidos
    const { count: countConvertidos } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('status', 'fechado')

    const { data: allLeads } = await supabase.from('leads').select('id, status, origem, source')
    const total = allLeads?.length || 0

    const sourceMap: Record<string, { total: number; vendidos: number }> = {}

    if (allLeads) {
      allLeads.forEach((l) => {
        let src = (l.origem || l.source || 'Outros').toLowerCase()
        if (src.includes('icarros')) src = 'iCarros'
        else if (
          src.includes('mercado livre') ||
          src.includes('mercadolivre') ||
          src.includes('ml')
        )
          src = 'Mercado Livre'
        else if (src.includes('webmotors')) src = 'Webmotors'
        else if (src.includes('olx')) src = 'OLX'
        else if (src.includes('whatsapp') || src.includes('wpp')) src = 'WhatsApp'
        else if (src.includes('instagram') || src.includes('ig')) src = 'Instagram'
        else if (src.includes('facebook') || src.includes('fb')) src = 'Facebook'
        else if (src.includes('site')) src = 'Site'
        else src = 'Outros'

        if (!sourceMap[src]) sourceMap[src] = { total: 0, vendidos: 0 }
        sourceMap[src].total++
        if (l.status === 'fechado') sourceMap[src].vendidos++
      })
    }

    const chartData = Object.keys(sourceMap)
      .map((k) => ({
        name: k,
        total: sourceMap[k].total,
        vendidos: sourceMap[k].vendidos,
        taxa:
          sourceMap[k].total > 0
            ? Math.round((sourceMap[k].vendidos / sourceMap[k].total) * 100)
            : 0,
      }))
      .sort((a, b) => b.total - a.total)

    setFunnelData(chartData)

    // Pages published
    const { count: countPages } = await supabase
      .from('pages')
      .select('id', { count: 'exact' })
      .eq('status_publicacao', 'Publicado')

    const { count: countArticles } = await supabase
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('status_publicacao', 'Publicado')

    const { count: countLPs } = await supabase
      .from('landing_pages')
      .select('id', { count: 'exact' })
      .eq('published', true)

    // Estoque
    const { data: veiculos } = await supabase
      .from('veiculos')
      .select('id, fotos, created_at')
      .eq('status', 'disponivel')

    let semFoto = 0
    let parados = 0
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

    if (veiculos) {
      veiculos.forEach((v) => {
        if (!v.fotos || (Array.isArray(v.fotos) && v.fotos.length === 0)) semFoto++
        if (new Date(v.created_at) < trintaDiasAtras) parados++
      })
    }

    setMetrics({
      leadsPendentes: countPendentes || 0,
      leadsAndamento: countAndamento || 0,
      leadsConvertidos: countConvertidos || 0,
      estoqueTotal: veiculos?.length || 0,
      estoqueSemFoto: semFoto,
      estoqueParado: parados,
      totalLeads: total,
      pagesPublished: (countPages || 0) + (countArticles || 0) + (countLPs || 0),
    })
  }

  const handleModuleClick = async (route: string, modulo: string) => {
    await supabase
      .from('access_log')
      .insert({ usuario_id: user?.id, modulo: modulo, acao: 'acessou' })
    navigate(route)
  }

  const isAdminMaster =
    user?.email === 'lgacomerciodeveiculos@gmail.com' ||
    user?.email === 'adriana.araujo@kmzero.com.br'
  const visibleModules = ALL_MODULES.filter((m) => userModules.includes(m.id) || isAdminMaster)

  const exportCSV = () => {
    const headers = ['Métrica', 'Valor']
    const rows = [
      ['Leads Pendentes', metrics.leadsPendentes],
      ['Leads em Andamento', metrics.leadsAndamento],
      ['Leads Convertidos', metrics.leadsConvertidos],
      ['Estoque Total', metrics.estoqueTotal],
      ['Estoque Sem Foto', metrics.estoqueSemFoto],
      ['Estoque Parado (+30 dias)', metrics.estoqueParado],
    ]
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'relatorio_executivo.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportPDF = () => {
    window.print()
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-[#F4F6F8] print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto space-y-8 print:space-y-4">
        <div className="flex justify-between items-center print:hidden mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Visão Executiva</h1>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Exportar CSV
            </button>
            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Exportar PDF
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
              Olá, {userName}.
            </h1>
            <p className="text-slate-500 text-sm">Resumo do seu centro de comando hoje</p>
          </div>
        </div>

        {/* Dashboard de Indicadores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center p-4 gap-4 border-l-4 border-amber-500">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Leads Pendentes</p>
                  <h3 className="text-2xl font-bold text-slate-800">{metrics.leadsPendentes}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center p-4 gap-4 border-l-4 border-blue-500">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Em Negociação</p>
                  <h3 className="text-2xl font-bold text-slate-800">{metrics.leadsAndamento}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center p-4 gap-4 border-l-4 border-green-500">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Vendas Fechadas</p>
                  <h3 className="text-2xl font-bold text-slate-800">{metrics.leadsConvertidos}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center p-4 gap-4 border-l-4 border-slate-700">
                <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Estoque Ativo</p>
                  <h3 className="text-2xl font-bold text-slate-800">{metrics.estoqueTotal}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Últimas sincronizações por plataforma */}
        {syncSummary.length > 0 && (
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-slate-500" /> Sincronizações com Portais
              </CardTitle>
              <button
                onClick={() => navigate('/admin/portais')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Ver log completo →
              </button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {syncSummary.map((s) => (
                  <div
                    key={s.platform}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.cor || '#999' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{s.nome}</p>
                      <p className="text-[11px] text-slate-400">
                        {s.ultimaSincronizacao
                          ? `Última: ${new Date(s.ultimaSincronizacao).toLocaleString('pt-BR')}`
                          : 'Sem sincronizações registradas'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {s.sucessos24h}
                      </span>
                      <span className="flex items-center gap-1 text-red-500 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> {s.erros24h}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Funnel Health Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="col-span-1 lg:col-span-2 shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">
                Saúde do Funil (Por Origem)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ChartContainer
                  config={{
                    total: { label: 'Total Leads', color: 'hsl(var(--chart-1))' },
                    vendidos: { label: 'Vendidos', color: 'hsl(var(--chart-2))' },
                  }}
                >
                  <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Total Leads"
                    />
                    <Bar dataKey="vendidos" fill="#10b981" radius={[4, 4, 0, 0]} name="Vendas" />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1 shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">
                Taxa de Conversão Global
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" stroke="#f1f5f9" strokeWidth="16" fill="none" />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#10b981"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray="502.65"
                    strokeDashoffset={
                      metrics.totalLeads > 0
                        ? 502.65 - 502.65 * (metrics.leadsConvertidos / metrics.totalLeads)
                        : 502.65
                    }
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-slate-800">
                    {metrics.totalLeads > 0
                      ? ((metrics.leadsConvertidos / metrics.totalLeads) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Conversão
                  </span>
                </div>
              </div>
              <p className="text-center text-sm text-slate-500 mt-6">
                De {metrics.totalLeads} leads gerados,
                <br />
                {metrics.leadsConvertidos} foram fechados.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Marketing Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm text-white p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Activity className="w-6 h-6" /> Hub de Marketing Integrado
            </h2>
            <p className="text-blue-100 max-w-xl">
              Gere posts com Inteligência Artificial, gerencie suas redes sociais e automatize
              e-mails diretamente pelo painel de Marketing.
            </p>
          </div>
          <button
            onClick={() => handleModuleClick('/admin/marketing', 'marketing')}
            className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Acessar Marketing
          </button>
        </div>

        {/* Alertas de Qualidade de Estoque */}
        {(metrics.estoqueSemFoto > 0 || metrics.estoqueParado > 0) && (
          <div className="flex flex-wrap gap-4">
            {metrics.estoqueSemFoto > 0 && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm border border-red-100 shadow-sm">
                <CameraOff className="w-4 h-4" /> <strong>{metrics.estoqueSemFoto}</strong> veículos
                sem fotos.
              </div>
            )}
            {metrics.estoqueParado > 0 && (
              <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-md text-sm border border-orange-100 shadow-sm">
                <AlertTriangle className="w-4 h-4" /> <strong>{metrics.estoqueParado}</strong>{' '}
                veículos no estoque há mais de 30 dias.
              </div>
            )}
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Acesso Rápido aos Módulos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleModules.map((m) => (
              <ModuleCard
                key={m.id}
                icon={m.icon}
                line1={m.line1}
                line2={m.line2}
                isNew={m.isNew}
                badgeText={
                  m.id === 'crm' && metrics.leadsPendentes > 0
                    ? `${metrics.leadsPendentes} novos`
                    : m.id === 'site' && metrics.pagesPublished > 0
                      ? `${metrics.pagesPublished} online`
                      : undefined
                }
                onClick={() => handleModuleClick(m.route, m.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
