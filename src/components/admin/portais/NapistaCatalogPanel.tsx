import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { syncNapistaCatalogo, type NapistaCatalogSyncResult } from '@/services/plataformas'
import { NapistaPendenciasReview } from './NapistaPendenciasReview'

// Só a etapa de catálogo (marcas/modelos/versões) existe até agora — a
// publicação de anúncios de verdade (napista-sync) é a próxima etapa, ainda
// não implementada. Ver docs/integracao-napista.md.
export function NapistaCatalogPanel() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<NapistaCatalogSyncResult | null>(null)
  const { toast } = useToast()

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const res = await syncNapistaCatalogo()
      setResult(res)
      toast({
        title: res.success ? 'Catálogo NaPista sincronizado' : 'Erro ao sincronizar catálogo',
        description: res.success
          ? `${res.combos_processadas ?? 0} combinações marca+modelo processadas.`
          : res.error,
        variant: res.success ? 'default' : 'destructive',
      })
    } catch (err: any) {
      toast({ title: 'Erro ao sincronizar catálogo', description: err.message, variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const erros = (result?.resultados || []).filter((r) => r.erro)

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Publicação de anúncios no NaPista ainda não existe — isso só sincroniza o catálogo de
        referência (marcas/modelos/versões) do NaPista pros veículos que temos em estoque,
        passo necessário antes de publicar.
      </p>

      <Button size="sm" onClick={handleSync} disabled={syncing}>
        {syncing ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
        )}
        {syncing ? 'Sincronizando catálogo...' : 'Sincronizar catálogo NaPista'}
      </Button>

      {result && (
        <div className="text-xs space-y-1.5 mt-2">
          {result.success ? (
            <div className="flex items-center gap-1.5 text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{result.combos_processadas ?? 0} combinações marca+modelo processadas.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-700">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{result.error}</span>
            </div>
          )}
          {erros.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2 space-y-1">
              <p className="font-medium text-amber-800">
                {erros.length} combinação(ões) sem correspondência no NaPista:
              </p>
              {erros.map((r, i) => (
                <p key={i} className="text-amber-700">
                  {r.marca} {r.modelo} — {r.erro}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t pt-3 mt-3">
        <NapistaPendenciasReview />
      </div>
    </div>
  )
}
