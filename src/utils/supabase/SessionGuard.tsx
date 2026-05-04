import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function SessionGuard({ children }: Props) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!session) {
          navigate('/login')
        }
        setIsLoading(false)
      })
      .catch(() => {
        navigate('/login')
        setIsLoading(false)
      })
  }, [navigate])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background w-full gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">
          Verificando autenticação...
        </p>
      </div>
    )
  }

  return <>{children}</>
}
