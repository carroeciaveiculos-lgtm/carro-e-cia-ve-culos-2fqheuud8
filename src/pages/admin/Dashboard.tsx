import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { ModuleCard } from '@/components/admin/ModuleCard'
import { Card, CardContent } from '@/components/ui/card'
import {
  Car,
  Target,
  Antenna,
  Monitor,
  ClipboardCheck,
  BarChart2,
  Megaphone,
  Settings,
  Users,
  Clock,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  CameraOff,
} from 'lucide-react'

const ALL_MODULES = [
  { id: 'estoque', icon: Car, line1: 'Gestão de', line2: 'Estoque', route: '/admin/estoque' },
  { id: 'crm', icon: Target, line1: 'Centro de', line2: 'Negociações', route: '/admin/crm' },
  { id: 'portais', icon: Antenna, line1: 'Integração', line2: 'Portais', route: '/admin/portais' },
  { id: 'site', icon: Monitor, line1: 'Gerenciador', line2: 'do Site', route: '/admin/site' },
  {
    id: 'avaliacao',
    icon: ClipboardCheck,
    line1: 'Avaliação',
    line2: 'de Veículos',
    route: '/admin/avaliacao',
  },
  {
    id: 'relatorios',
    icon: BarChart2,
    line1: 'Relatórios',
    line2: 'e Métricas',
    route: '/admin/relatorios',
  },
  {
    id: 'marketing',
    icon: Megaphone,
    line1: 'Central de',
    line2: 'Marketing',
    route: '/admin/marketing',
    isNew: true,
  },
  {
    id: 'configuracoes',
    icon: Settings,
    line1: 'Configurações',
    line2: 'do Sistema',
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
  })

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

  return (
    <div className="flex-1 p-4 md:p-8 bg-[#F4F6F8]">
      <div className="max-w-6xl mx-auto space-y-8">
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
