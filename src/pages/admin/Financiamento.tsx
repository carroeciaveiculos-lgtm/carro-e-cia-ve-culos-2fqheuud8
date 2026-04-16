import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Banknote, Calculator, FileCheck, History } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Financiamento() {
  const [valor, setValor] = useState('50000')
  const [entrada, setEntrada] = useState('10000')

  const vFinanciado = Number(valor) - Number(entrada)
  const tx = 0.015
  const prestacao48 = (vFinanciado * tx) / (1 - Math.pow(1 + tx, -48))

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Banknote className="w-6 h-6 text-blue-600" /> Simulador de Financiamentos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulações rápidas e análise de crédito integrada.
          </p>
        </div>
      </div>

      <Tabs defaultValue="simulador" className="w-full">
        <TabsList className="mb-6 flex flex-wrap h-auto p-1">
          <TabsTrigger value="simulador" className="flex-1">
            <Calculator className="w-4 h-4 mr-2" /> Nova Simulação
          </TabsTrigger>
          <TabsTrigger value="analise" className="flex-1">
            <FileCheck className="w-4 h-4 mr-2" /> Análise de Crédito
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex-1">
            <History className="w-4 h-4 mr-2" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulador" className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Dados da Simulação</h3>
              <div>
                <Label>Valor do Veículo (R$)</Label>
                <Input
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Valor da Entrada (R$)</Label>
                <Input
                  type="number"
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Simular Parcelas
              </Button>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center">
              <h3 className="font-bold text-blue-800 mb-4 text-center">Resultado Aproximado</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-blue-200 pb-2">
                  <span className="text-slate-600">Valor Financiado:</span>
                  <span className="font-bold">R$ {vFinanciado.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between border-b border-blue-200 pb-2">
                  <span className="text-slate-600">Taxa Estimada:</span>
                  <span className="font-bold">1.50% a.m.</span>
                </div>
                <div className="flex justify-between pt-2 items-center">
                  <span className="text-slate-600">48x de:</span>
                  <span className="text-2xl font-bold text-blue-700">
                    R$ {prestacao48.toFixed(2)}
                  </span>
                </div>
              </div>
              <Button className="mt-6 bg-green-600 hover:bg-green-700">Gerar Proposta PDF</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analise" className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold text-lg mb-4">Análise de Perfil de Crédito</h3>
          <p className="text-sm text-slate-500 mb-6">
            Realize consultas integradas para oferecer a melhor taxa aos seus clientes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <Label>CPF do Cliente</Label>
              <Input placeholder="000.000.000-00" className="mt-1" />
            </div>
            <div>
              <Label>Renda Mensal</Label>
              <Input type="number" placeholder="R$ 0,00" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Button className="w-full bg-slate-800 hover:bg-slate-900">Consultar Score</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold text-lg mb-4">Simulações Recentes</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Valor Financiado</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Hoje, 10:30</TableCell>
                  <TableCell>Roberto Carlos</TableCell>
                  <TableCell>Fiat Toro</TableCell>
                  <TableCell>R$ 90.000</TableCell>
                  <TableCell>
                    <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">
                      Aprovado BV
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
