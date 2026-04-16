import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Copy, Mail, Download, PenTool, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { downloadBlob } from '@/utils/downloadFile'

interface AssinaturaDialogProps {
  contratoId: string
  emailCliente: string
  nomeCliente: string
  proprietarioTelefone?: string
  proprietarioCpf?: string
  numeroContrato?: string
  pdfUrl?: string
}

export function AssinaturaDialog({
  contratoId,
  emailCliente,
  nomeCliente,
  proprietarioTelefone,
  proprietarioCpf,
  numeroContrato,
  pdfUrl,
}: AssinaturaDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [signingLink, setSigningLink] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSendToAutentique = async (mode: 'link' | 'email') => {
    if (!contratoId || !emailCliente || !nomeCliente) {
      toast({
        title: 'Dados Incompletos',
        description: 'Faltam dados do cliente (Nome/E-mail) para enviar o contrato.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)
    try {
      let finalPdfUrl = pdfUrl
      let storagePath =
        pdfUrl || `contratos/pdf/contrato_consignacao_${numeroContrato || contratoId}.pdf`

      if (!finalPdfUrl || !finalPdfUrl.startsWith('http')) {
        if (storagePath.startsWith('contratos-consignacao/')) {
          storagePath = storagePath.replace('contratos-consignacao/', '')
        }

        const { data } = await supabase.storage
          .from('contratos-consignacao')
          .createSignedUrl(storagePath, 3600)
        if (data?.signedUrl) {
          finalPdfUrl = data.signedUrl
        } else {
          throw new Error(
            'Não foi possível acessar o PDF. Gere o PDF primeiro clicando em "Gerar e Baixar PDF".',
          )
        }
      }

      const { data, error } = await supabase.functions.invoke('enviar-para-assinatura', {
        body: {
          contrato_id: contratoId,
          email_cliente: emailCliente,
          nome_cliente: nomeCliente,
          proprietario_telefone: proprietarioTelefone,
          proprietario_cpf: proprietarioCpf,
          numero_contrato: numeroContrato,
          pdf_url: finalPdfUrl,
        },
      })

      if (error) throw new Error(error.message)
      if (!data?.success) throw new Error(data?.error || 'Erro ao integrar com Autentique')

      if (data.signing_link) {
        setSigningLink(data.signing_link)
      }

      if (mode === 'email') {
        toast({
          title: 'Enviado com sucesso',
          description:
            'O documento foi enviado para o e-mail do cliente e o link de assinatura também está disponível abaixo.',
        })
      } else {
        toast({
          title: 'Link Gerado',
          description: 'O link de assinatura foi gerado com sucesso.',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro na Assinatura',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyLink = () => {
    if (signingLink) {
      navigator.clipboard.writeText(signingLink)
      toast({
        title: 'Link copiado',
        description: 'Link de assinatura copiado para a área de transferência.',
      })
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      let downloadPath =
        pdfUrl || `contratos/pdf/contrato_consignacao_${numeroContrato || contratoId}.pdf`

      if (downloadPath.startsWith('http')) {
        const parts = downloadPath.split('contratos-consignacao/')
        if (parts.length > 1) {
          downloadPath = parts[1].split('?')[0]
        } else {
          window.open(downloadPath, '_blank')
          setIsDownloading(false)
          return
        }
      } else if (downloadPath.startsWith('contratos-consignacao/')) {
        downloadPath = downloadPath.replace('contratos-consignacao/', '')
      }

      const { data, error } = await supabase.storage
        .from('contratos-consignacao')
        .download(downloadPath)
      if (error)
        throw new Error(
          'Não foi possível encontrar o arquivo PDF no repositório. Gere o arquivo primeiro clicando no botão Gerar PDF.',
        )

      const blob = new Blob([data], { type: 'application/pdf' })
      downloadBlob(blob, `contrato_${numeroContrato || contratoId}.pdf`)
    } catch (err: any) {
      toast({ title: 'Erro ao baixar', description: err.message, variant: 'destructive' })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
        >
          <PenTool className="w-4 h-4 mr-2" />
          Assinatura Autentique
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-800">Opções de Assinatura</DialogTitle>
          <DialogDescription className="text-slate-500">
            Escolha como deseja prosseguir com a assinatura do contrato para o cliente{' '}
            <strong>{nomeCliente}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-5 py-2">
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">1. Assinatura Digital</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={() => handleSendToAutentique('link')}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Gerar Link
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={() => handleSendToAutentique('email')}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Enviar E-mail
              </Button>
            </div>

            {signingLink && (
              <div className="flex gap-2 mt-2 items-center bg-slate-50 p-2 rounded-md border border-slate-200">
                <Input value={signingLink} readOnly className="text-xs bg-white h-8" />
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={handleCopyLink}
                >
                  Copiar
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100"></div>

          <div className="flex flex-col space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">2. Assinatura Física</h4>
            <p className="text-xs text-slate-500 mb-2">
              Baixe o contrato em PDF para imprimir e assinar presencialmente com as partes.
            </p>
            <Button
              variant="secondary"
              className="w-full bg-slate-100 text-slate-800 hover:bg-slate-200"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Baixar Cópia em PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
