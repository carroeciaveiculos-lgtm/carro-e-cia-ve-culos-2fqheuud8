import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck } from 'lucide-react'

export default function RedefinirSenha() {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // O link do e-mail já deixa a sessão de recuperação pronta no client
    // (detectSessionInUrl, padrão do supabase-js) — só confirmamos que ela
    // existe antes de deixar a pessoa tentar trocar a senha.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessaoValida(!!session)
    })
  }, [])

  const handleRedefinir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (senha.length < 8) {
      toast({ title: 'A senha precisa ter no mínimo 8 caracteres', variant: 'destructive' })
      return
    }
    if (senha !== confirmarSenha) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setLoading(false)

    if (error) {
      toast({ title: 'Erro ao redefinir senha', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Senha redefinida com sucesso!' })
    navigate('/admin')
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
          <h1 className="text-2xl font-display font-bold text-white">Nova Senha</h1>
          <p className="text-secondary-foreground/70 text-sm mt-1">Painel Administrativo</p>
        </div>
        <div className="p-8">
          {sessaoValida === false ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Este link de redefinição expirou ou já foi usado. Peça um novo em "Esqueci minha
                senha" na tela de login.
              </p>
              <Button className="w-full" onClick={() => navigate('/admin/login')}>
                Voltar pro login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRedefinir} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="senha">Nova senha</Label>
                <Input
                  id="senha"
                  type="password"
                  required
                  minLength={8}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  required
                  minLength={8}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-12 mt-4" disabled={loading}>
                {loading ? (
                  'Salvando...'
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" /> Salvar nova senha
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
