import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  MIN_FOTOS_LIMPAS,
  type ResumoFotos,
  listarAuditoria,
  verificarVeiculo,
} from '@/services/fotos-ia'

// Aba "Fotos" da Central de Redes Sociais (04/10/2026): mostra, por veículo ativo, quantas fotos têm a
// marca de IA do Galaxy AI ("Conteúdo gerado por IA"). O carrossel automático só usa fotos limpas e
// precisa de pelo menos 6. Esta tela NÃO remove nem esconde a marca: serve para a equipe saber quais
// fotos reenviar (as originais, sem edição por IA) e sincronizar de novo pelo Drive.

const nomeVeiculo = (r: ResumoFotos) =>
  [r.veiculo.marca, r.veiculo.modelo, r.veiculo.versao].filter(Boolean).join(' ') || 'Veículo'

const arquivo = (url: string) => decodeURIComponent(url.split('/').pop() || url)

const SITUACAO = {
  apto: {
    rotulo: 'Apto para carrossel',
    classe: 'bg-green-50 text-green-700 border-green-300',
    Icone: CheckCircle2,
  },
  precisa_fotos: {
    rotulo: 'Precisa de fotos novas',
    classe: 'bg-red-50 text-red-700 border-red-300',
    Icone: AlertTriangle,
  },
  nao_verificado: {
    rotulo: 'Não verificado',
    classe: 'bg-slate-50 text-slate-600 border-slate-300',
    Icone: HelpCircle,
  },
} as const

export function FotosMarcaIA() {
  const { toast } = useToast()
  const [linhas, setLinhas] = useState<ResumoFotos[]>([])
  const [carregando, setCarregando] = useState(true)
  const [verificando, setVerificando] = useState<{ feitos: number; total: number } | null>(null)
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [soProblemas, setSoProblemas] = useState(false)

  const carregar = useCallback(async () => {
    const { data, error } = await listarAuditoria()
    if (error) {
      toast({ title: 'Não foi possível carregar as fotos', variant: 'destructive' })
    } else {
      // pior situação primeiro: precisa de fotos, depois não verificado, depois aptos
      const ordem = { precisa_fotos: 0, nao_verificado: 1, apto: 2 } as const
      setLinhas(
        [...data].sort((a, b) => ordem[a.situacao] - ordem[b.situacao] || a.limpas - b.limpas),
      )
    }
    setCarregando(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const resumo = useMemo(() => {
    const total = linhas.reduce((s, r) => s + r.total, 0)
    const marcadas = linhas.reduce((s, r) => s + r.marcadas, 0)
    const naoVerif = linhas.reduce((s, r) => s + r.naoVerificadas, 0)
    return {
      veiculos: linhas.length,
      total,
      marcadas,
      naoVerif,
      aptos: linhas.filter((r) => r.situacao === 'apto').length,
      precisam: linhas.filter((r) => r.situacao === 'precisa_fotos').length,
    }
  }, [linhas])

  // Verifica um veículo por vez, 2 ao mesmo tempo (cada chamada lê as fotos do veículo pela rede)
  const verificar = async (todos: boolean) => {
    const alvo = linhas.filter((r) => todos || r.naoVerificadas > 0)
    if (alvo.length === 0) {
      toast({ title: 'Todas as fotos já foram verificadas' })
      return
    }
    setVerificando({ feitos: 0, total: alvo.length })
    let feitos = 0
    let falhas = 0
    let i = 0
    const trabalhador = async () => {
      while (i < alvo.length) {
        const r = alvo[i++]
        const { erro } = await verificarVeiculo(r.veiculo.id, todos)
        if (erro) falhas++
        feitos++
        setVerificando({ feitos, total: alvo.length })
      }
    }
    await Promise.all([trabalhador(), trabalhador()])
    setVerificando(null)
    await carregar()
    toast({
      title: falhas ? `Verificação concluída com ${falhas} falha(s)` : 'Verificação concluída',
      variant: falhas ? 'destructive' : 'default',
    })
  }

  const alternar = (id: string) =>
    setAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })

  const visiveis = soProblemas ? linhas.filter((r) => r.situacao !== 'apto') : linhas

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
        <p className="font-semibold mb-1">Fotos com marca de IA</p>
        <p>
          Fotos editadas com o <b>Photo assist (Galaxy AI, Samsung)</b> trazem a marca d'água
          "Conteúdo gerado por IA" dentro da imagem. O carrossel automático usa{' '}
          <b>só fotos sem a marca</b> e precisa de pelo menos {MIN_FOTOS_LIMPAS}. Esta tela não
          remove a marca: para resolver,{' '}
          <b>reenvie as fotos originais (sem edição por IA) ao Drive</b> e sincronize o veículo de
          novo.
        </p>
        <p className="mt-1 text-xs text-amber-800">
          A verificação lê os metadados da foto. Uma foto editada e depois reenviada por WhatsApp
          perde os metadados e mantém a marca d'água, então pode aparecer como "limpa" aqui. Confira
          a foto de olho.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-slate-600">
          <b>{resumo.veiculos}</b> veículos · <b>{resumo.total}</b> fotos · <b>{resumo.marcadas}</b>{' '}
          com marca de IA
          {resumo.total > 0 && ` (${Math.round((100 * resumo.marcadas) / resumo.total)}%)`} ·{' '}
          <b className="text-green-700">{resumo.aptos}</b> aptos ·{' '}
          <b className="text-red-700">{resumo.precisam}</b> precisam de fotos novas
          {resumo.naoVerif > 0 && (
            <>
              {' '}
              · <b>{resumo.naoVerif}</b> fotos ainda não verificadas
            </>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant={soProblemas ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setSoProblemas((v) => !v)}
          >
            Só os com problema
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={!!verificando}
            onClick={() => verificar(false)}
          >
            {verificando ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Verificando {verificando.feitos}/
                {verificando.total}
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" /> Verificar fotos novas
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!!verificando}
            onClick={() => verificar(true)}
            title="Lê todas as fotos de novo (use depois de reenviar fotos pelo Drive)"
          >
            Reverificar tudo
          </Button>
        </div>
      </div>

      {carregando ? (
        <p className="text-center text-sm text-slate-500 py-10">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Carregando...
        </p>
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {visiveis.map((r) => {
            const s = SITUACAO[r.situacao]
            const aberto = abertos.has(r.veiculo.id)
            return (
              <div key={r.veiculo.id}>
                <button
                  type="button"
                  onClick={() => r.marcadas > 0 && alternar(r.veiculo.id)}
                  className={cn(
                    'w-full text-left px-3 py-3 flex items-center gap-3',
                    r.marcadas > 0 ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default',
                  )}
                >
                  {r.marcadas > 0 ? (
                    aberto ? (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    )
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{nomeVeiculo(r)}</p>
                    <p className="text-xs text-slate-500">{r.veiculo.placa}</p>
                  </div>
                  <div className="text-xs text-slate-600 text-right shrink-0">
                    <span className="text-green-700 font-semibold">{r.limpas} limpas</span>
                    {' · '}
                    <span className={r.marcadas > 0 ? 'text-amber-700 font-semibold' : ''}>
                      {r.marcadas} com marca
                    </span>
                    {r.naoVerificadas > 0 && <> · {r.naoVerificadas} não verif.</>}
                  </div>
                  <Badge variant="outline" className={cn('text-xs gap-1 shrink-0', s.classe)}>
                    <s.Icone className="w-3 h-3" /> {s.rotulo}
                  </Badge>
                </button>
                {aberto && (
                  <div className="px-3 pb-3 pl-10">
                    <p className="text-xs text-slate-500 mb-2">
                      Fotos com marca de IA neste veículo (reenvie as originais destas):
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {r.urlsMarcadas.map((u) => (
                        <div key={u} className="text-[10px] text-slate-500">
                          <img
                            src={u}
                            alt={arquivo(u)}
                            loading="lazy"
                            className="w-full aspect-[4/3] object-cover rounded border-2 border-amber-400"
                          />
                          <span className="block truncate" title={arquivo(u)}>
                            {arquivo(u)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {visiveis.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">Nenhum veículo para mostrar.</p>
          )}
        </div>
      )}
    </div>
  )
}
