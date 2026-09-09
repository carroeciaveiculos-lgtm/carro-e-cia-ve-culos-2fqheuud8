import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  RefreshCw,
  FileText,
  Users,
  ShoppingCart,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAutonomiaConfig, type AutonomiaConfig } from '@/services/autonomia'
import { SystemDirectives } from '@/components/admin/SystemDirectives'

// Achado 08/09/2026: nenhum dos 9 toggles desta tela é lido em lugar
// nenhum do sistema (isAutonomiaEnabled/logAutonomiaAction nunca são
// chamados). Os 4 abaixo já rodam sempre, via cron/trigger, independente
// do que estiver marcado aqui; os outros 5 não têm nenhuma automação
// implementada. Ver docs/admin-ia-conteudo.md, seção "Painel de Autonomia".
const SEMPRE_ATIVO = new Set([
  'ml_auto_publish',
  'wm_auto_publish',
  'unpublish_on_sold',
  'reengage_leads_24h',
])

const GROUPS = [
  {
    title: 'Sincronização de Estoque',
    color: 'border-blue-500',
    headerColor: 'text-blue-600',
    icon: RefreshCw,
    slugs: ['ml_auto_publish', 'wm_auto_publish'],
  },
  {
    title: 'Descrições',
    color: 'border-green-500',
    headerColor: 'text-green-600',
    icon: FileText,
    slugs: ['auto_generate_description'],
  },
  {
    title: 'Leads',
    color: 'border-yellow-500',
    headerColor: 'text-yellow-600',
    icon: Users,
    slugs: ['reengage_leads_24h'],
  },
  {
    title: 'Vendas',
    color: 'border-red-500',
    headerColor: 'text-red-600',
    icon: ShoppingCart,
    slugs: ['unpublish_on_sold'],
  },
  {
    title: 'Alertas',
    color: 'border-orange-500',
    headerColor: 'text-orange-600',
    icon: AlertTriangle,
    slugs: ['alert_missing_fields', 'alert_quota_limit', 'alert_sync_failure'],
  },
  {
    title: 'Log de Auditoria',
    color: 'border-purple-500',
    headerColor: 'text-purple-600',
    icon: ClipboardList,
    slugs: ['log_audit_actions'],
  },
]

export default function AutonomiaPage() {
  const [configs, setConfigs] = useState<AutonomiaConfig[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const configData = await fetchAutonomiaConfig()
      setConfigs(configData)
    } catch (err: any) {
      toast.error(`Erro ao carregar configurações: ${err?.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getConfig = (slug: string) => configs.find((c) => c.slug === slug)

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel de Autonomia</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Status real de cada automação — nenhuma delas tem um interruptor de verdade por trás,
          então esta tela só mostra o que já roda sozinho e o que ainda não existe.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((group) => {
          const Icon = group.icon
          return (
            <Card key={group.title} className={`border-l-4 ${group.color}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 text-base ${group.headerColor}`}>
                  <Icon className="h-5 w-5" />
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading
                  ? group.slugs.map((s) => <Skeleton key={s} className="h-10 w-full" />)
                  : group.slugs.map((slug) => {
                      const cfg = getConfig(slug)
                      if (!cfg) return null
                      const sempreAtivo = SEMPRE_ATIVO.has(slug)
                      return (
                        <div
                          key={slug}
                          className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                        >
                          <span className="text-sm font-medium flex-1">{cfg.label}</span>
                          {sempreAtivo ? (
                            <Badge className="bg-green-600 hover:bg-green-600 shrink-0">
                              Sempre ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground shrink-0">
                              Não implementado
                            </Badge>
                          )}
                        </div>
                      )
                    })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SystemDirectives />
    </div>
  )
}
