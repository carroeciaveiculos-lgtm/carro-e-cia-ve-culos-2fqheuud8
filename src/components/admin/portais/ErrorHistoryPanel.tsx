import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2 } from 'lucide-react'
import { diagnosePortalError } from '@/services/ai-onboarding'

interface ErrorRecord {
  platform: string
  veiculo_id: string
  marca: string | null
  modelo: string | null
  erro_msg: string | null
  status: string | null
  updated_at: string | null
  diagnosis?: string
}

export function ErrorHistoryPanel() {
  const [errors, setErrors] = useState<ErrorRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('estoque_publicacoes')
        .select('platform, veiculo_id, erro_msg, status, updated_at, veiculos(marca, modelo)')
        .not('erro_msg', 'is', null)
        .neq('erro_msg', '')
        .order('updated_at', { ascending: false })
        .limit(15)
      const mapped = (data || []).map((r: any) => ({
        platform: r.platform,
        veiculo_id: r.veiculo_id,
        marca: r.veiculos?.marca ?? null,
        modelo: r.veiculos?.modelo ?? null,
        erro_msg: r.erro_msg,
        status: r.status,
        updated_at: r.updated_at,
      }))
      setErrors(mapped)
      setLoading(false)
    }
    load()
  }, [])

  const handleDiagnose = async (idx: number, errorMsg: string, platform: string) => {
    const diagnosis = await diagnosePortalError(errorMsg, platform)
    setErrors((prev) => prev.map((e, i) => (i === idx ? { ...e, diagnosis } : e)))
  }

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  if (errors.length === 0)
    return <div className="text-center py-8 text-gray-500 text-sm">Nenhum erro registrado.</div>

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {errors.map((e, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="destructive" className="text-[9px]">
                {e.platform}
              </Badge>
              <span className="text-xs font-medium text-gray-700">
                {e.marca} {e.modelo}
              </span>
            </div>
            <p className="text-xs text-red-700">{e.erro_msg}</p>
            {e.diagnosis && (
              <p className="text-xs text-blue-600 mt-1 font-medium">💡 {e.diagnosis}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-400">
                {new Date(e.updated_at || '').toLocaleString('pt-BR')}
              </span>
              {!e.diagnosis && (
                <button
                  onClick={() => handleDiagnose(i, e.erro_msg || '', e.platform)}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  Diagnosticar com IA
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
