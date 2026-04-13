import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const Login = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate('/admin')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border">
        <div className="text-center mb-8">
          <div className="inline-flex bg-primary text-white p-3 rounded-xl font-display font-bold text-3xl leading-none mb-4">
            C&C
          </div>
          <h1 className="font-display font-bold text-2xl">Acesso Restrito</h1>
          <p className="text-muted-foreground text-sm">
            Faça login para acessar o painel administrativo.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@carroecia.com.br"
              required
              defaultValue="admin@carroecia.com.br"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <a href="#" className="text-xs text-primary hover:underline">
                Esqueceu a senha?
              </a>
            </div>
            <Input id="password" type="password" required defaultValue="password123" />
          </div>
          <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Login
