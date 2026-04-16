import React, { useState } from 'react'
import { downloadBlob } from '@/utils/downloadFile'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ContratoData } from '@/types/contrato'

interface ContratoPdfGeneratorProps {
  contratoData: ContratoData
}

export function ContratoPdfGenerator({ contratoData }: ContratoPdfGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerateAndDownloadPdf = async () => {
    setIsLoading(true)

    try {
      if (!contratoData || !contratoData.proprietario?.nome) {
        throw new Error('Dados do contrato incompletos para geração do PDF.')
      }

      const { data, error } = await supabase.functions.invoke('gerar-pdf-contrato', {
        body: { contratoData },
      })

      if (error) throw new Error(`Erro ao invocar função de PDF: ${error.message}`)
      if (!data?.success) throw new Error(data?.error || 'Falha ao gerar PDF')

      const { file_path } = data
      const filename = `contrato_consignacao_${contratoData.numeroContrato || Date.now()}.pdf`

      // Baixar o PDF gerado do Supabase Storage
      const { data: blobData, error: downloadError } = await supabase.storage
        .from('contratos-consignacao')
        .download(file_path)

      if (downloadError) throw new Error(`Erro ao baixar o PDF: ${downloadError.message}`)

      const pdfBlob = new Blob([blobData], { type: 'application/pdf' })

      toast({
        title: 'Sucesso',
        description: `Contrato PDF gerado e salvo no repositório. O download iniciará em instantes.`,
      })

      downloadBlob(pdfBlob, filename)
    } catch (err: any) {
      console.error('Erro ao gerar ou baixar PDF:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao gerar documento PDF.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-xs bg-white text-red-700 border-red-200 hover:bg-red-50"
      onClick={handleGenerateAndDownloadPdf}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin mr-2" />
      ) : (
        <FileText className="w-3 h-3 mr-2" />
      )}
      Gerar e Baixar PDF
    </Button>
  )
}
