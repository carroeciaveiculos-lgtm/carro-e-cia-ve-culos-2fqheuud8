import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      toast({
        title: 'Acesso negado',
        description: 'E-mail ou senha incorretos.',
        variant: 'destructive',
      })
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-card rounded-2xl shadow-xl border overflow-hidden">
        <div className="bg-secondary p-8 text-center flex flex-col items-center justify-center">
          <img
            src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia%20quadrado.png"
            alt="Logo"
            className="w-20 h-20 mb-4 rounded-xl shadow-md"
          />
          <h1 className="text-2xl font-display font-bold text-white">Painel Administrativo</h1>
          <p className="text-secondary-foreground/70 text-sm mt-1">Acesso exclusivo para equipe</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@carroecia.com.br"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-12 mt-4" disabled={loading}>
              {loading ? (
                'Autenticando...'
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Entrar no Sistema
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
