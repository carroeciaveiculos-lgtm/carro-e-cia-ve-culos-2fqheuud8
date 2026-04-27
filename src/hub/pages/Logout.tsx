import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'

export default function LogoutPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    signOut().then(() => {
      navigate('/login')
    })
  }, [signOut, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm text-center">
        <p className="text-lg font-medium">Saindo do MotoresHub...</p>
      </div>
    </div>
  )
}
