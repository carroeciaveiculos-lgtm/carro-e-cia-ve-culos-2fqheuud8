import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClipboardCheck, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Avaliacao() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const gerarFicha = () => {
    setLoading(true)
    setTimeout(() => {
      toast({
        title: 'Ficha Registrada',
        description: 'A ficha de avaliação foi salva no sistema com sucesso.',
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Avaliação de Veículos</h2>
        <p className="text-muted-foreground">
          Gerencie as avaliações de veículos para entrada no estoque.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Nova Avaliação
            </CardTitle>
            <CardDescription>Inicie uma nova avaliação de veículo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa do Veículo</Label>
              <Input id="placa" placeholder="ABC-1234" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente">Nome do Cliente</Label>
              <Input id="cliente" placeholder="Nome completo" />
            </div>
            <Button onClick={gerarFicha} disabled={loading} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              {loading ? 'Registrando Avaliação...' : 'Iniciar Avaliação'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Avaliações</CardTitle>
            <CardDescription>Últimas avaliações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma avaliação recente encontrada.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
