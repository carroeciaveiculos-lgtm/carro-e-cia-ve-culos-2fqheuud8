import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export function usePermissoes() {
  const { user } = useAuth()
  const [nivel, setNivel] = useState<string | null>(null)
  const [setorNomes, setSetorNomes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let cancelado = false

    const carregar = async () => {
      const { data: usuarioRow } = await supabase
        .from('usuarios')
        .select('nivel')
        .eq('id', user.id)
        .single()

      const { data: vinculos } = await supabase
        .from('usuario_setores')
        .select('setores(nome)')
        .eq('usuario_id', user.id)

      if (cancelado) return

      setNivel(usuarioRow?.nivel ?? null)
      setSetorNomes(
        (vinculos || [])
          .map((v: any) => v.setores?.nome as string | undefined)
          .filter((nome): nome is string => !!nome),
      )
      setLoading(false)
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [user])

  return { nivel, setorNomes, loading }
}
