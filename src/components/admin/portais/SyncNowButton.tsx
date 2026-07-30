import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

interface SyncNowButtonProps {
  veiculoId: string
  veiculoNome?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SyncNowButton({
  veiculoId,
  veiculoNome,
  variant = 'outline',
  size = 'sm',
}: SyncNowButtonProps) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('sync-plataforma', {
        body: { veiculo_id: veiculoId, action: 'sync_now' },
      })
      if (error) throw error
      toast.success(`Sincronização iniciada${veiculoNome ? ` para ${veiculoNome}` : ''}`)
    } catch (err: any) {
      toast.error(`Erro ao sincronizar: ${err?.message || 'Falha na sincronização'}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
    </Button>
  )
}
