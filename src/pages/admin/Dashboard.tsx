import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { ModuleCard } from '@/components/admin/ModuleCard'
import {
  Car,
  Target,
  Antenna,
  Monitor,
  ClipboardCheck,
  BarChart2,
  Megaphone,
  Settings,
} from 'lucide-react'

const ALL_MODULES = [
  { id: 'estoque', icon: Car, line1: 'Estoque', line2: 'e Integrador', route: '/admin/estoque' },
  {
    id: 'crm',
    icon: Target,
    line1: 'Gerenciador',
    line2: 'de Leads',
    route: '/admin/crm',
    hasCounter: true,
  },
  {
    id: 'portais',
    icon: Antenna,
    line1: 'Portais e',
    line2: 'Redes Sociais',
    route: '/admin/portais',
  },
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
  const [leadsToday, setLeadsToday] = useState(0)

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

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .gte('created_at', today.toISOString())
        .then(({ count }) => {
          setLeadsToday(count || 0)
        })
    }
  }, [user])

  const handleModuleClick = async (route: string, modulo: string) => {
    await supabase.from('access_log').insert({
      usuario_id: user?.id,
      modulo: modulo,
      acao: 'acessou',
    })
    navigate(route)
  }

  const isAdminMaster =
    user?.email === 'lgacomerciodeveiculos@gmail.com' ||
    user?.email === 'adriana.araujo@kmzero.com.br'
  const visibleModules = ALL_MODULES.filter((m) => userModules.includes(m.id) || isAdminMaster)

  return (
    <div
      className="flex-1 p-4 md:p-8"
      style={{ background: 'linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center md:text-left mt-4">
          <h1 className="text-2xl font-bold text-[#0D47A1] mb-1 uppercase">Olá, {userName}.</h1>
          <p className="text-[#1565C0] text-lg">Qual módulo você deseja acessar?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleModules.map((m) => (
            <ModuleCard
              key={m.id}
              icon={m.icon}
              line1={m.line1}
              line2={m.line2}
              isNew={m.isNew}
              badgeText={m.hasCounter && leadsToday > 0 ? `${leadsToday} hoje` : undefined}
              onClick={() => handleModuleClick(m.route, m.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
