import React, { useState } from 'react'
import { ContratoData } from '@/types/contrato'
import { downloadBlob } from '@/utils/downloadFile'
import { uploadFileToSupabase } from '@/services/supabaseStorage'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ContratoDocxGeneratorProps {
  contratoData: ContratoData
}

const ContratoDocxGenerator: React.FC<ContratoDocxGeneratorProps> = ({ contratoData }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerateAndDownloadDocx = async () => {
    setIsLoading(true)

    try {
      if (!contratoData || !contratoData.numeroContrato || !contratoData.proprietario.nome) {
        throw new Error('Dados do contrato incompletos para geração do DOCX.')
      }

      // Delegação total da geração do arquivo para a Edge Function
      const { data: blobData, error } = await supabase.functions.invoke('gerar-pdf-contrato', {
        body: { contratoData },
      })

      if (error) {
        throw new Error('Falha ao processar o documento no servidor.')
      }

      const filename = `contrato_consignacao_${contratoData.numeroContrato}.docx`
      const filePath = `rascunhos/${filename}`

      // O retorno vem parseado como Blob quando o Content-Type é application/vnd.openxmlformats...
      const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const typedBlob = new Blob([blobData as BlobPart], { type: docxMimeType })

      await uploadFileToSupabase('contratos-consignacao', filePath, typedBlob, docxMimeType)

      toast({
        title: 'Sucesso',
        description: `Contrato DOCX gerado e salvo no repositório. O download iniciará em instantes.`,
      })

      downloadBlob(typedBlob, filename)
    } catch (err: any) {
      console.error('Erro ao gerar ou baixar DOCX:', err)
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
      variant="outline"
      size="sm"
      className="text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
      onClick={handleGenerateAndDownloadDocx}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin mr-2" />
      ) : (
        <FileText className="w-3 h-3 mr-2" />
      )}
      Baixar Contrato DOCX
    </Button>
  )
}

export default ContratoDocxGenerator
