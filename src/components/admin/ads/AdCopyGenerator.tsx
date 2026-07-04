import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Loader2, Car } from 'lucide-react'
import { generateAdCopy } from '@/services/ads-manager'
import { useToast } from '@/hooks/use-toast'

export function AdCopyGenerator() {
  const [product, setProduct] = useState('Venda de Veículos')
  const [audience, setAudience] = useState('Pessoas buscando carro seminovo em Uberaba e região')
  const [tone, setTone] = useState('Profissional')
  const [loading, setLoading] = useState(false)
  const [variations, setVariations] = useState<any[]>([])
  const { toast } = useToast()

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await generateAdCopy(product, audience, tone)
      setVariations(result?.variations || [])
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Gerador de Anúncios IA
          </CardTitle>
          <CardDescription>
            Gera variações de copy para marketing automotivo, focando em vendas, consignação,
            financiamento e avaliação de troca.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Produto / Serviço</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venda de Veículos">Venda de Veículos</SelectItem>
                  <SelectItem value="Consignação de Veículos">Consignação de Veículos</SelectItem>
                  <SelectItem value="Financiamento Auto">Financiamento Auto</SelectItem>
                  <SelectItem value="Avaliação de Troca">Avaliação de Troca</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tom de Voz</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venda de Veículos">Venda de Veículos</SelectItem>
                  <SelectItem value="Consignação de Veículos">Consignação de Veículos</SelectItem>
                  <SelectItem value="Financiamento Auto">Financiamento Auto</SelectItem>
                  <SelectItem value="Avaliação de Troca">Avaliação de Troca</SelectItem>
                </SelectContent>{' '}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Público-Alvo</Label>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Ex: Pessoas buscando carro seminovo em Uberaba e região"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Gerar Variações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {variations.length > 0 && (
        <div className="grid gap-4">
          {variations.map((v, i) => (
            <Card key={i} className="border-purple-200">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg">{v.headline}</h4>
                  <Badge variant="outline">Variação {i + 1}</Badge>
                </div>
                <p className="text-slate-600">{v.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-500">CTA:</span>
                  <Badge className="bg-purple-100 text-purple-700">{v.cta}</Badge>
                </div>
                {v.compliance_notes && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
                    <Car className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">{v.compliance_notes}</p>
                  </div>
                )}{' '}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
