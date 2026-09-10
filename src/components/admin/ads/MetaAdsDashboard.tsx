import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Loader2, RefreshCw, Check, X, Wallet, Lightbulb, History } from 'lucide-react'
import {
  getAccountBalance,
  getRecommendations,
  listSolicitacoesAjuste,
  aplicarSolicitacaoAjuste,
  rejeitarSolicitacaoAjuste,
  getAuditLogs,
  type AccountBalance,
  type Recommendation,
  type SolicitacaoAjuste,
} from '@/services/ads-manager'
import { useToast } from '@/hooks/use-toast'
import { CampaignPanel } from '@/components/admin/ads/CampaignPanel'

function formatBRL(centavos: string | number) {
  const valor = Number(centavos) / 100
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MetaAdsDashboard() {
  const [balance, setBalance] = useState<AccountBalance | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAjuste[]>([])
  const [loadingFila, setLoadingFila] = useState(true)
  const [decidindo, setDecidindo] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const { toast } = useToast()

  const loadLogs = useCallback(() => {
    getAuditLogs('meta', 15)
      .then(setLogs)
      .catch(() => {})
  }, [])

  const loadFila = useCallback(async () => {
    setLoadingFila(true)
    try {
      setSolicitacoes(await listSolicitacoesAjuste('meta'))
    } catch (e: any) {
      toast({ title: 'Erro ao carregar fila', description: e.message, variant: 'destructive' })
    } finally {
      setLoadingFila(false)
    }
  }, [toast])

  useEffect(() => {
    getAccountBalance('meta')
      .then(setBalance)
      .catch((e) => toast({ title: 'Erro ao carregar gasto/limite', description: e.message, variant: 'destructive' }))
      .finally(() => setLoadingBalance(false))

    getRecommendations('meta')
      .then(setRecommendations)
      .catch((e) => toast({ title: 'Erro ao carregar recomendações', description: e.message, variant: 'destructive' }))
      .finally(() => setLoadingRecs(false))

    loadFila()
    loadLogs()
  }, [loadFila, loadLogs, toast])

  const handleAprovar = async (id: string) => {
    setDecidindo(id)
    try {
      const atualizada = await aplicarSolicitacaoAjuste(id)
      if (atualizada.status === 'erro') {
        toast({
          title: 'A Meta recusou o ajuste',
          description: atualizada.erro || 'Erro desconhecido',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Aplicado na Meta com sucesso' })
      }
      loadFila()
      loadLogs()
    } catch (e: any) {
      toast({ title: 'Erro ao aplicar', description: e.message, variant: 'destructive' })
    } finally {
      setDecidindo(null)
    }
  }

  const handleRejeitar = async (id: string) => {
    setDecidindo(id)
    try {
      await rejeitarSolicitacaoAjuste(id)
      toast({ title: 'Solicitação rejeitada' })
      loadFila()
    } catch (e: any) {
      toast({ title: 'Erro ao rejeitar', description: e.message, variant: 'destructive' })
    } finally {
      setDecidindo(null)
    }
  }

  const pendentes = solicitacoes.filter((s) => s.status === 'pendente')
  const decididas = solicitacoes.filter((s) => s.status !== 'pendente')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="w-4 h-4" /> Gasto da conta
          </CardTitle>
          <CardDescription>
            A Meta cobra automaticamente do cartão ao atingir o limite — não é uma carteira com
            saldo pra gastar, é quanto falta até a próxima cobrança.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBalance ? (
            <Skeleton className="h-16 w-full" />
          ) : balance ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Gasto atual</p>
                <p className="text-xl font-semibold">{formatBRL(balance.amount_spent)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Limite de cobrança</p>
                <p className="text-xl font-semibold">{formatBRL(balance.spend_cap)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Falta pra próxima cobrança</p>
                <p className="text-xl font-semibold text-green-700">
                  {formatBRL(Number(balance.spend_cap) - Number(balance.amount_spent))}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Não foi possível carregar.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="w-4 h-4" /> Recomendações da Meta
          </CardTitle>
          <CardDescription>
            Vêm direto da plataforma, por conta (não dá por campanha). Aplicar exige abrir no
            Gerenciador de Anúncios — a Meta não permite aplicar a maioria via API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingRecs ? (
            <Skeleton className="h-20 w-full" />
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma recomendação no momento.</p>
          ) : (
            recommendations.map((r, i) => (
              <div key={i} className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p>{r.recommendation_content?.body}</p>
                  {r.recommendation_content?.lift_estimate && (
                    <Badge variant="outline" className="shrink-0 text-emerald-700 border-emerald-300">
                      {r.recommendation_content.lift_estimate}
                    </Badge>
                  )}
                </div>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    Abrir no Gerenciador de Anúncios <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Fila de Aprovação {pendentes.length > 0 && `(${pendentes.length})`}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadFila} disabled={loadingFila}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingFila ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>
          <CardDescription>
            Nenhum ajuste de orçamento ou status vai pra Meta sem você aprovar aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingFila ? (
            <Skeleton className="h-16 w-full" />
          ) : pendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido pendente.</p>
          ) : (
            pendentes.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{s.campanha_nome || s.campanha_id}</p>
                  <p className="text-muted-foreground">{s.descricao}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    disabled={decidindo === s.id}
                    onClick={() => handleAprovar(s.id)}
                  >
                    {decidindo === s.id ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3 mr-1" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decidindo === s.id}
                    onClick={() => handleRejeitar(s.id)}
                  >
                    <X className="w-3 h-3 mr-1" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))
          )}
          {decididas.length > 0 && (
            <details className="pt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Ver últimas decisões ({decididas.length})
              </summary>
              <div className="space-y-1 mt-2">
                {decididas.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1">
                    <span>
                      {s.campanha_nome || s.campanha_id} — {s.descricao}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        s.status === 'aplicado'
                          ? 'text-emerald-700 border-emerald-300'
                          : s.status === 'erro'
                            ? 'text-red-700 border-red-300'
                            : 'text-muted-foreground'
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      <CampaignPanel platform="meta" onSolicitacaoCriada={loadFila} />

      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="w-4 h-4" /> Histórico de ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                  <span>{log.acao}</span>
                  <span className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
