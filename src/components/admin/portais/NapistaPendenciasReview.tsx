import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl } from '@/lib/image-utils'
import {
  fetchNapistaPendencias,
  confirmarMapeamentoNapista,
  remapearVeiculoNapista,
  motivoPendenciaNapista,
  type NapistaPendencia,
} from '@/services/plataformas'

const MOTIVO_LABEL: Record<string, string> = {
  marca: 'Marca não reconhecida',
  modelo: 'Escolha o modelo correto',
  versao: 'Escolha a versão correta',
  catalogo_napista: 'Cor, câmbio ou combustível sem correspondência',
}

// Fila de veículos que o napista-mapear-veiculo não conseguiu casar sozinho
// com confiança suficiente. Diferente do modal do Webmotors (que só aparece
// na hora de salvar um veículo específico), essa é uma tela de verdade —
// mostra TODAS as pendências de uma vez, não só a do veículo que você
// estiver editando no momento.
export function NapistaPendenciasReview() {
  const [pendencias, setPendencias] = useState<NapistaPendencia[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNapistaPendencias()
      setPendencias(data)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar pendências', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const setActingFor = (veiculoId: string, value: boolean) =>
    setActing((prev) => ({ ...prev, [veiculoId]: value }))

  const handleEscolherModelo = async (veiculoId: string, modeloId: string) => {
    setActingFor(veiculoId, true)
    try {
      const res = await confirmarMapeamentoNapista(veiculoId, modeloId, undefined)
      if (res.success) {
        toast({ title: 'Modelo confirmado — re-buscando versões...' })
        await remapearVeiculoNapista(veiculoId)
        await load()
      } else {
        toast({ title: 'Erro ao confirmar', description: res.error, variant: 'destructive' })
      }
    } finally {
      setActingFor(veiculoId, false)
    }
  }

  const handleEscolherVersao = async (veiculoId: string, versionId: string) => {
    setActingFor(veiculoId, true)
    try {
      const res = await confirmarMapeamentoNapista(veiculoId, undefined, versionId)
      toast({
        title: res.success ? 'Versão confirmada!' : 'Erro ao confirmar',
        description: res.success ? undefined : res.error,
        variant: res.success ? 'default' : 'destructive',
      })
      if (res.success) await load()
    } finally {
      setActingFor(veiculoId, false)
    }
  }

  const handleRemapear = async (veiculoId: string) => {
    setActingFor(veiculoId, true)
    try {
      const res = await remapearVeiculoNapista(veiculoId)
      if (res.status === 'mapeado') {
        toast({ title: 'Mapeado automaticamente agora!' })
      } else if (!res.success) {
        toast({ title: 'Erro ao remapear', description: res.error, variant: 'destructive' })
      }
      await load()
    } finally {
      setActingFor(veiculoId, false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (pendencias.length === 0) {
    return (
      <div className="text-xs text-gray-500 flex items-center gap-1.5 py-2">
        Nenhuma pendência de mapeamento no NaPista.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-700">
          {pendencias.length} veículo(s) pendente(s) de mapeamento NaPista
        </h4>
        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={load}>
          <RefreshCw className="w-3 h-3 mr-1" /> Atualizar
        </Button>
      </div>

      {pendencias.map((p) => {
        const motivo = motivoPendenciaNapista(p)
        const isActing = acting[p.veiculo_id] || false
        const foto = p.fotos?.[0] ? getImageUrl(p.fotos[0]) : null

        return (
          <div key={p.veiculo_id} className="border border-amber-200 bg-amber-50/40 rounded-lg p-3">
            <div className="flex items-start gap-2.5">
              {foto && (
                <img src={foto} alt="" className="w-14 h-11 object-cover rounded shrink-0 bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {p.marca} {p.modelo} {p.versao || ''}
                </p>
                <p className="text-[10px] text-amber-800 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {MOTIVO_LABEL[motivo]}
                </p>
                {p.erro_msg && <p className="text-[10px] text-gray-500 mt-0.5">{p.erro_msg}</p>}
              </div>
            </div>

            {motivo === 'modelo' && p.candidatos_modelo.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-medium text-gray-600">Escolha o modelo correto:</p>
                {p.candidatos_modelo.map((c) => (
                  <Button
                    key={c.id}
                    size="sm"
                    variant="outline"
                    className="w-full justify-between h-7 text-xs"
                    disabled={isActing}
                    onClick={() => handleEscolherModelo(p.veiculo_id, c.id)}
                  >
                    <span>{c.nome}</span>
                    <span className="text-[10px] text-gray-400">{Math.round((c.score || 0) * 100)}%</span>
                  </Button>
                ))}
              </div>
            )}

            {motivo === 'versao' && p.candidatos_versao.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-medium text-gray-600">Escolha a versão correta:</p>
                {p.candidatos_versao.map((c) => (
                  <Button
                    key={c.id}
                    size="sm"
                    variant="outline"
                    className="w-full justify-between h-7 text-xs"
                    disabled={isActing}
                    onClick={() => handleEscolherVersao(p.veiculo_id, c.id)}
                  >
                    <span>{c.nome}</span>
                    <span className="text-[10px] text-gray-400">{Math.round((c.score || 0) * 100)}%</span>
                  </Button>
                ))}
              </div>
            )}

            {(motivo === 'marca' || motivo === 'catalogo_napista') && (
              <p className="text-[10px] text-amber-700 mt-2">
                Sem escolha automática pra esse caso — ajuste o cadastro do veículo (ou o catálogo,
                se for cor/câmbio/combustível faltando) e clique em "Remapear".
              </p>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] mt-2"
              disabled={isActing}
              onClick={() => handleRemapear(p.veiculo_id)}
            >
              {isActing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              Remapear
            </Button>
          </div>
        )
      })}
    </div>
  )
}
