import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user) {
      supabase
        .from('usuarios')
        .select('nivel')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.nivel === 'admin_master') setIsAdmin(true)
        })
      supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setUsuarios(data)
        })
    }
  }, [user])

  if (!isAdmin) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center mt-20">
        <ShieldAlert className="w-16 h-16 text-[#C62828] mb-4" />
        <h2 className="text-2xl font-bold text-[#0D47A1]">Acesso Negado</h2>
        <p className="text-muted-foreground mt-2">
          Apenas administradores master podem acessar esta página.
        </p>
      </div>
    )
  }

  return (
    <div
      className="p-4 md:p-8 flex-1"
      style={{ background: 'linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 mt-4">
          <h1 className="text-3xl font-bold text-[#0D47A1]">Gerenciar Usuários</h1>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nome</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Nível</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#0D47A1]">{u.nome}</td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-50 text-[#1565C0] rounded-full text-[11px] font-bold uppercase tracking-wider border border-blue-100">
                          {u.nivel ? u.nivel.replace('_', ' ') : 'operador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/usuarios/${u.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#1565C0] hover:text-[#0D47A1] hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-2" /> Editar
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
