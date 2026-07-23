import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Link } from 'react-router-dom'
import { Loader2, Zap, FlaskConical, AlertCircle } from 'lucide-react'
import type { Plataforma } from '@/services/plataformas'

interface Props {
  plataformas: Plataforma[]
  selectedCount: number
  allSelected: boolean
  onSelectAll: (checked: boolean) => void
  onBulkSync: () => void
  onDryRun: () => void
  onToggleDiagnosis: () => void
  activePortalFilter: string | null
  onPortalFilter: (slug: string | null) => void
  syncing: boolean
}

export function GlobalActionsBar({
  plataformas,
  selectedCount,
  allSelected,
  onSelectAll,
  onBulkSync,
  onDryRun,
  onToggleDiagnosis,
  activePortalFilter,
  onPortalFilter,
  syncing,
}: Props) {
  return (
    <div className="bg-white rounded-lg border p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-600 mr-1">Sync Rápido:</span>
        {plataformas.map((p) => (
          <Button
            key={p.slug}
            variant={activePortalFilter === p.slug ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => onPortalFilter(activePortalFilter === p.slug ? null : p.slug)}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: p.cor || '#999' }}
            />
            <span className="text-xs">{p.nome}</span>
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(v) => onSelectAll(v === true)}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-xs font-medium cursor-pointer">
            Selecionar Todos ({selectedCount})
          </label>
        </div>

        <Button
          size="sm"
          onClick={onBulkSync}
          disabled={selectedCount === 0 || syncing}
          className="h-8 bg-[#0D47A1] hover:bg-[#0B3E8F]"
        >
          {syncing ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 mr-1.5" />
          )}
          Sincronizar Selecionados
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onDryRun}
          disabled={selectedCount === 0 || syncing}
        >
          <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
          Simular Sync
        </Button>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-8" onClick={onToggleDiagnosis}>
            <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
            Diagnóstico ML
          </Button>
          <Link to="/admin/portais/revisao">
            <Button variant="outline" size="sm" className="h-8">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
              Revisão de Pendências
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
