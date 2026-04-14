import { Hammer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function EmConstrucao() {
  const navigate = useNavigate()

  return (
    <div
      className="flex-1 p-8 flex flex-col items-center justify-center text-center"
      style={{ background: 'linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 100%)' }}
    >
      <div className="bg-white p-12 rounded-2xl shadow-xl flex flex-col items-center max-w-md">
        <div className="bg-blue-50 p-6 rounded-full mb-6">
          <Hammer className="w-16 h-16 text-[#1565C0] animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-[#0D47A1]">Módulo em Construção</h2>
        <p className="text-muted-foreground mt-3 mb-8 leading-relaxed">
          Esta funcionalidade está sendo desenvolvida com base no sistema Autocerto e estará
          disponível nas próximas atualizações do seu painel.
        </p>
        <Button onClick={() => navigate('/admin')} className="bg-[#1565C0] hover:bg-[#0D47A1]">
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  )
}
