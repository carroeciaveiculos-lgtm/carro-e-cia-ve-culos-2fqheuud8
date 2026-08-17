import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false)
  const [linkEnviado, setLinkEnviado] = useState(false)
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

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviandoRecuperar(true)
    try {
      const { error } = await supabase.functions.invoke('esqueci-senha', {
        body: { email: emailRecuperar },
      })
      if (error) throw error
      setLinkEnviado(true)
    } catch {
      // Mesma mensagem genérica independente do resultado — evita
      // confirmar/negar se o e-mail existe no sistema.
      setLinkEnviado(true)
    } finally {
      setEnviandoRecuperar(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-card rounded-2xl shadow-xl border overflow-hidden">
        <div className="bg-secondary p-8 text-center flex flex-col items-center justify-center">
          <img
            src="https://imagens.carroeciamotors.com.br/logos-e-imagens/logos/logo-carro-e-cia.webp"
            alt="Logo"
            className="w-20 h-20 mb-4 rounded-xl shadow-md object-contain bg-white p-1"
            onError={(e) => {
              const img = e.currentTarget
              if (img.dataset.fallback !== 'true') {
                img.dataset.fallback = 'true'
                img.src = '/placeholder.svg'
              }
            }}
          />
          <h1 className="text-2xl font-display font-bold text-white">Painel Administrativo</h1>
          <p className="text-secondary-foreground/70 text-sm mt-1">Acesso exclusivo para equipe</p>
        </div>
        <div className="p-8">
          {!modoRecuperar ? (
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
              <button
                type="button"
                onClick={() => setModoRecuperar(true)}
                className="text-sm text-muted-foreground hover:text-foreground underline w-full text-center"
              >
                Esqueci minha senha
              </button>
            </form>
          ) : linkEnviado ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Se <strong>{emailRecuperar}</strong> estiver cadastrado, mandamos um link de
                redefinição pra esse e-mail. Confira a caixa de entrada (e o spam).
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setModoRecuperar(false)
                  setLinkEnviado(false)
                  setEmailRecuperar('')
                }}
              >
                Voltar pro login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRecuperar} className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Digite o e-mail cadastrado que mandamos um link pra você criar uma senha nova.
              </p>
              <div className="space-y-2">
                <Label htmlFor="emailRecuperar">E-mail</Label>
                <Input
                  id="emailRecuperar"
                  type="email"
                  required
                  value={emailRecuperar}
                  onChange={(e) => setEmailRecuperar(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-12 mt-4" disabled={enviandoRecuperar}>
                {enviandoRecuperar ? 'Enviando...' : 'Enviar link de redefinição'}
              </Button>
              <button
                type="button"
                onClick={() => setModoRecuperar(false)}
                className="text-sm text-muted-foreground hover:text-foreground underline w-full text-center"
              >
                Voltar pro login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
