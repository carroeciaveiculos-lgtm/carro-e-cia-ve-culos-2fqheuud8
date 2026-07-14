import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Zap, UploadCloud, EyeOff, Trash2, RefreshCw } from 'lucide-react'
import type { Plataforma } from '@/services/plataformas'

interface Props {
  plataformas: Plataforma[]
  selectedCount: number
  totalCount: number
  allSelected: boolean
  onSelectAll: (checked: boolean) => void
  onBulkPublish: () => void
  onBulkUnpublish: () => void
  onBulkDelete: () => void
  onQuickSync: (slug: string) => void
  onSyncAll: () => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  syncing: boolean
  syncingSlug: string | null
}

export function GlobalActionsBar({
  plataformas,
  selectedCount,
  allSelected,
  onSelectAll,
  onBulkPublish,
  onBulkUnpublish,
  onBulkDelete,
  onQuickSync,
  onSyncAll,
  pageSize,
  onPageSizeChange,
  syncing,
  syncingSlug,
}: Props) {
  return (
    <div className="bg-white rounded-lg border p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-600 mr-1">Sync Rápido:</span>
        {plataformas.map((p) => (
          <Button
            key={p.slug}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => onQuickSync(p.slug)}
            disabled={syncing}
          >
            {syncingSlug === p.slug ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: p.cor || '#999' }}
              />
            )}
            <span className="text-xs">{p.nome}</span>
          </Button>
        ))}
        <Button
          size="sm"
          onClick={onSyncAll}
          disabled={syncing}
          className="h-8 ml-auto bg-[#0D47A1] hover:bg-[#0B3E8F]"
        >
          {syncing ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 mr-1.5" />
          )}
          Sincronizar Tudo
        </Button>
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

        {selectedCount > 0 && (
          <div className="flex gap-2 animate-fade-in">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
              onClick={onBulkPublish}
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Publicar ({selectedCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
              onClick={onBulkUnpublish}
            >
              <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Desativar ({selectedCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-red-700 border-red-200 bg-red-50 hover:bg-red-100"
              onClick={onBulkDelete}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir ({selectedCount})
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">Itens por página:</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
