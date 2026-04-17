import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BadgeDollarSign, Calculator, Building } from 'lucide-react'

export default function Financiamento() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financiamento</h2>
        <p className="text-muted-foreground">Gestão de simulações e propostas de financiamento.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Simulações
            </CardTitle>
            <CardDescription>Calculadora de financiamento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Módulo de simulação integrado com os bancos parceiros em desenvolvimento.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5" />
              Propostas
            </CardTitle>
            <CardDescription>Acompanhamento de aprovações</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma proposta em andamento no momento.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Bancos Parceiros
            </CardTitle>
            <CardDescription>Taxas e condições cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tabela de coeficientes e fatores multiplicadores estará disponível em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
