import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const submit = async () => {
    setError('')
    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      setError(signInError.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">MotoresHub – Login</h1>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          className="border p-2 mb-3 w-full rounded"
          placeholder="E-mail"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 mb-3 w-full rounded"
          placeholder="Senha"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded w-full transition-colors"
        >
          Entrar
        </button>
      </div>
    </div>
  )
}
