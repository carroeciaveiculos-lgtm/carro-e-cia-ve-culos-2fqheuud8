import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  RefreshCw,
  FileText,
  Users,
  ShoppingCart,
  AlertTriangle,
  ClipboardList,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchAutonomiaConfig,
  toggleAutonomiaConfig,
  fetchAutonomiaLogs,
  type AutonomiaConfig,
  type AutonomiaLog,
} from '@/services/autonomia'

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
  const [logs, setLogs] = useState<AutonomiaLog[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [configData, logData] = await Promise.all([
        fetchAutonomiaConfig(),
        fetchAutonomiaLogs(30),
      ])
      setConfigs(configData)
      setLogs(logData)
    } catch (err: any) {
      toast.error(`Erro ao carregar configurações: ${err?.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggle = async (slug: string, enabled: boolean) => {
    setToggling(slug)
    try {
      await toggleAutonomiaConfig(slug, enabled)
      setConfigs((prev) => prev.map((c) => (c.slug === slug ? { ...c, enabled } : c)))
      toast.success(`Configuração ${enabled ? 'ativada' : 'desativada'}`)
    } catch (err: any) {
      toast.error(`Erro ao atualizar: ${err?.message}`)
    } finally {
      setToggling(null)
    }
  }

  const getConfig = (slug: string) => configs.find((c) => c.slug === slug)

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel de Autonomia</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure as automações do sistema em tempo real.
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
                      return (
                        <div
                          key={slug}
                          className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                        >
                          <span className="text-sm font-medium flex-1">{cfg.label}</span>
                          <Switch
                            checked={cfg.enabled}
                            disabled={toggling === slug}
                            onCheckedChange={(v) => handleToggle(slug, v)}
                          />
                        </div>
                      )
                    })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            Log de Auditoria — Ações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma ação registrada ainda.
            </p>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{log.action}</p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground truncate">
                          {typeof log.details === 'string'
                            ? log.details
                            : JSON.stringify(log.details)}
                        </p>
                      )}
                      {log.result && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-accent">
                          {log.result}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
