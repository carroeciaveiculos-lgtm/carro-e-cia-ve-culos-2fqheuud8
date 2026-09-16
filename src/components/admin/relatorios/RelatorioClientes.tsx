import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Users, MapPin, Download, Trophy } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { estimarRegiaoPorTelefone } from '@/lib/ddd-regiao'

// Aba "Clientes" (Etapa 4, 15/09/2026) — redefinida a partir do que a
// auditoria achou: a tabela `clientes` é só cache de CPF de proprietário na
// troca (VehicleFormModal), nunca ganha cidade/estado e não é editada por
// nenhuma tela. "Cliente" de verdade, no sentido gerencial, é o lead que
// fechou negócio: leads.status = 'fechado'. Mesma estimativa de região por
// DDD da aba Leads (não tem endereço real gravado também).
//
// Achado ao conferir com dado real (15/09/2026): hoje há ZERO leads com
// status 'fechado' no banco — a aba funciona, mas fica vazia até alguém
// marcar uma venda como fechada no CRM. Não é bug desta implementação.
//
// Não existe coluna de data de fechamento — uso `updated_at` como proxy
// (aproximado: muda em qualquer edição do lead, não só ao fechar).
export function RelatorioClientes() {
  const [clientesRaw, setClientesRaw] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('todos')
  const [vendedorFilter, setVendedorFilter] = useState('todos')
  const [regiaoFilter, setRegiaoFilter] = useState('todas')

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      let query = supabase
        .from('leads')
        .select('*, responsavel:usuarios(id, nome)')
        .eq('status', 'fechado')
        .order('updated_at', { ascending: false })

      if (periodo !== 'todos') {
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - parseInt(periodo))
        query = query.gte('updated_at', dateLimit.toISOString())
      }
      if (vendedorFilter !== 'todos') {
        query = query.eq('responsavel_id', vendedorFilter)
      }

      const [clientesRes, vendRes] = await Promise.all([
        query,
        supabase.from('usuarios').select('id, nome').eq('role', 'vendedor'),
      ])

      if (clientesRes.data) setClientesRaw(clientesRes.data)
      if (vendRes.data) setVendedores(vendRes.data)

      setLoading(false)
    }

    loadData()
  }, [periodo, vendedorFilter])

  const clientesComRegiao = useMemo(
    () => clientesRaw.map((c) => ({ ...c, _regiao: estimarRegiaoPorTelefone(c.telefone) })),
    [clientesRaw],
  )

  const regioesDisponiveis = useMemo(() => {
    const contagem: Record<string, number> = {}
    clientesComRegiao.forEach((c) => {
      contagem[c._regiao] = (contagem[c._regiao] || 0) + 1
    })
    return Object.entries(contagem).sort((a, b) => b[1] - a[1])
  }, [clientesComRegiao])

  const clientes = useMemo(
    () =>
      regiaoFilter === 'todas'
        ? clientesComRegiao
        : clientesComRegiao.filter((c) => c._regiao === regiaoFilter),
    [clientesComRegiao, regiaoFilter],
  )

  const porVendedor = useMemo(() => {
    const grupos: Record<string, number> = {}
    clientes.forEach((c) => {
      const nome = c.responsavel?.nome || 'IA / Não Atribuído'
      grupos[nome] = (grupos[nome] || 0) + 1
    })
    return Object.entries(grupos).sort((a, b) => b[1] - a[1])
  }, [clientes])

  const exportarCSV = () => {
    const headers = [
      'Nome',
      'Telefone',
      'Região (estimada)',
      'Veículo de Interesse',
      'Vendedor',
      'Fechado em',
    ]
    const linhas = clientes.map((c) => [
      c.nome || '',
      c.telefone || '',
      c._regiao,
      c.carro_modelo || c.veiculo_interesse || '',
      c.responsavel?.nome || 'IA / Não Atribuído',
      c.updated_at ? new Date(c.updated_at).toLocaleDateString('pt-BR') : '',
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...linhas]
        .map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', 'relatorio_clientes.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <p className="text-slate-500 text-sm">
          Clientes = leads com venda fechada. Região estimada pelo DDD, não é o endereço real.
        </p>

        <div className="flex flex-wrap gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo o período</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <Users className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Vendedores</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={regiaoFilter} onValueChange={setRegiaoFilter}>
            <SelectTrigger className="w-[220px] bg-white">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as regiões</SelectItem>
              {regioesDisponiveis.map(([regiao, count]) => (
                <SelectItem key={regiao} value={regiao}>
                  {regiao} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="bg-white" onClick={exportarCSV}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border-none">
          <p className="text-slate-500">Carregando dados...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Clientes (venda fechada)</p>
                    <h3 className="text-2xl font-bold text-slate-800">{clientes.length}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Vendedor com mais fechamentos
                    </p>
                    <h3 className="text-lg font-bold text-slate-800">
                      {porVendedor[0]?.[0] || '—'}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {clientes.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-8 text-center text-slate-400">
                Nenhum cliente com venda fechada no filtro selecionado. Isso reflete o CRM hoje —
                assim que um lead for marcado como "Venda Fechada", ele aparece aqui.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Clientes por Região
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {regioesDisponiveis.map(([regiao, count]) => {
                    const max = regioesDisponiveis[0]?.[1] || 1
                    return (
                      <div key={regiao} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-40 shrink-0 truncate">
                          {regiao}
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Por Vendedor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {porVendedor.map(([nome, count]) => {
                    const max = porVendedor[0]?.[1] || 1
                    return (
                      <div key={nome} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-32 shrink-0 truncate">
                          {nome}
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Lista de Clientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {clientes.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 border-b pb-2 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.nome}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {c.carro_modelo || c.veiculo_interesse || 'Não especificado'} •{' '}
                          {c._regiao}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-600">
                          {c.responsavel?.nome || 'IA / Não Atribuído'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {c.updated_at ? new Date(c.updated_at).toLocaleDateString('pt-BR') : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
