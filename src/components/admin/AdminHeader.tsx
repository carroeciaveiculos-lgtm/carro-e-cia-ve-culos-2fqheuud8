import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'
import { LogOut, Home, FileText, HelpCircle, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export function AdminHeader() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [empresa] = useState('Carro & Cia Veículos')

  useEffect(() => {
    if (user) {
      supabase
        .from('usuarios')
        .select('nome')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserName(data.nome)
          else setUserName(user.email || '')
        })
    }
  }, [user])

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const isAdminMaster =
    user?.email === 'lgacomerciodeveiculos@gmail.com' ||
    user?.email === 'adriana.araujo@kmzero.com.br'

  return (
    <header className="flex flex-col w-full shadow-sm z-10">
      {/* Linha 1 */}
      <div className="bg-[#0D47A1] text-white px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia%20quadrado.png"
            alt="Logo Carro e Cia"
            className="h-10 w-10 rounded bg-white p-1"
          />
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <NotificationBell />
          <div className="flex flex-col items-end text-right">
            <span className="font-bold text-xs md:text-sm uppercase max-w-[150px] md:max-w-none truncate">
              {userName}
            </span>
            <span className="text-[10px] md:text-xs text-white/80">{empresa}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/80 hover:text-white transition-colors ml-2"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Linha 2 - NAV BAR */}
      <div className="bg-[#1565C0] text-white px-4 md:px-6 py-2 flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm">
        <Link
          to="/admin"
          className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
        >
          <Home className="w-4 h-4" /> Home
        </Link>
        <Link
          to="/admin/faturas"
          className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
        >
          <FileText className="w-4 h-4" /> Faturas
        </Link>
        <Link
          to="/admin/suporte"
          className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
        >
          <HelpCircle className="w-4 h-4" /> Suporte
        </Link>

        {isAdminMaster && (
          <Link
            to="/admin/usuarios"
            className="flex items-center gap-1.5 hover:text-white/80 transition-colors ml-auto bg-[#0D47A1] px-3 py-1.5 rounded-full font-semibold border border-white/10 shadow-sm"
          >
            <Users className="w-4 h-4" /> Gerenciar Usuários
          </Link>
        )}
      </div>
    </header>
  )
}
