import React, { useState } from 'react'
import { ContratoData } from '@/types/contrato'
import { generateContratoDocx } from '@/utils/generateDocx'
import { downloadBlob } from '@/utils/downloadFile'
import { uploadFileToSupabase } from '@/services/supabaseStorage'
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

      const docxBlob = await generateContratoDocx(contratoData)
      const filename = `contrato_consignacao_${contratoData.numeroContrato}.docx`
      const filePath = `rascunhos/${filename}`

      await uploadFileToSupabase(
        'contratos-consignacao',
        filePath,
        docxBlob,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )

      toast({
        title: 'Sucesso',
        description: `Contrato DOCX gerado e salvo com sucesso.`,
      })

      downloadBlob(docxBlob, filename)
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
