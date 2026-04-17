import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Printer, FileSignature } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

export default function Administrativo() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const gerarDocumento = async (tipo: string) => {
    setLoading(tipo)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-contrato', {
        body: { tipo, dados: {} },
      })

      if (error) throw error

      if (data?.document) {
        const link = document.createElement('a')
        link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.document}`
        link.download = `${tipo}.docx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toast({
        title: 'Documento gerado',
        description: `O documento de ${tipo.replace('_', ' ')} foi gerado com sucesso.`,
      })
    } catch (error: any) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar documento',
        description: 'Não foi possível gerar o documento. Tente novamente mais tarde.',
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Administrativo</h2>
        <p className="text-muted-foreground">Gestão de contratos, recibos e documentos da loja.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Contratos
            </CardTitle>
            <CardDescription>Compra, venda e consignação</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => gerarDocumento('compra')}
              disabled={loading === 'compra'}
            >
              <FileText className="mr-2 h-4 w-4" />
              {loading === 'compra' ? 'Processando...' : 'Contrato de Compra'}
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => gerarDocumento('venda')}
              disabled={loading === 'venda'}
            >
              <FileText className="mr-2 h-4 w-4" />
              {loading === 'venda' ? 'Processando...' : 'Contrato de Venda'}
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => gerarDocumento('consignacao')}
              disabled={loading === 'consignacao'}
            >
              <FileText className="mr-2 h-4 w-4" />
              {loading === 'consignacao' ? 'Processando...' : 'Contrato de Consignação'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Recibos
            </CardTitle>
            <CardDescription>Emissão de recibos de pagamento</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => gerarDocumento('recibo_sinal')}
              disabled={loading === 'recibo_sinal'}
            >
              <FileText className="mr-2 h-4 w-4" />
              {loading === 'recibo_sinal' ? 'Processando...' : 'Recibo de Sinal'}
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => gerarDocumento('recibo_pagamento')}
              disabled={loading === 'recibo_pagamento'}
            >
              <FileText className="mr-2 h-4 w-4" />
              {loading === 'recibo_pagamento' ? 'Processando...' : 'Recibo de Pagamento'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Termos
            </CardTitle>
            <CardDescription>Termos de responsabilidade</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => gerarDocumento('termo_responsabilidade')}
              disabled={loading === 'termo_responsabilidade'}
            >
              <FileText className="mr-2 h-4 w-4" />
              {loading === 'termo_responsabilidade'
                ? 'Processando...'
                : 'Termo de Responsabilidade'}
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => gerarDocumento('termo_entrega')}
              disabled={loading === 'termo_entrega'}
            >
              <FileText className="mr-2 h-4 w-4" />
              {loading === 'termo_entrega' ? 'Processando...' : 'Termo de Entrega'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
