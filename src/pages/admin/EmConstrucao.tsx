import { HardHat } from 'lucide-react'

export default function EmConstrucao() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-[calc(100vh-100px)]">
      <div className="bg-slate-100 p-6 rounded-full mb-6">
        <HardHat className="w-16 h-16 text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
        Módulo em Desenvolvimento
      </h1>
      <p className="text-slate-500 mt-3 max-w-md text-sm">
        Estamos trabalhando intensamente para liberar este novo módulo para você. Em breve estará
        disponível na sua Central de Comando.
      </p>
    </div>
  )
}
