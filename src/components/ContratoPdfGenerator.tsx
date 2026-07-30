import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ContratoPdfGeneratorProps {
  veiculoId: string
  documentType?: string
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ContratoPdfGenerator({
  veiculoId,
  documentType = 'consignacao',
  label = 'Gerar PDF',
  variant = 'outline',
  size = 'sm',
}: ContratoPdfGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-contrato', {
        body: { veiculo_id: veiculoId, document_type: documentType },
      })

      if (error) throw new Error(`Erro ao invocar função: ${error.message}`)
      if (!data?.success) throw new Error(data?.error || 'Falha ao gerar documento')

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(data.html)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 500)
        toast({
          title: 'Documento gerado',
          description: 'Use a opção "Salvar como PDF" na janela de impressão.',
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Pop-up bloqueado. Permita pop-ups para gerar o PDF.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao gerar documento.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className="text-xs bg-white text-red-700 border-red-200 hover:bg-red-50"
      onClick={handleGenerate}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin mr-2" />
      ) : (
        <FileText className="w-3 h-3 mr-2" />
      )}
      {label}
    </Button>
  )
}
