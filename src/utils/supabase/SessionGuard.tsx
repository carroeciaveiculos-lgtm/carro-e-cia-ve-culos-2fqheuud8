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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg font-medium text-gray-900">Verificando autenticação...</div>
      </div>
    )
  }

  return <>{children}</>
}
