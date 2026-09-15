import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Car, DollarSign, Clock3, AlertTriangle, Download, Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Disponível',
  vendido: 'Vendido',
  devolvido: 'Devolvido',
  rascunho: 'Rascunho',
}

// Portais ativos de fato (OLX/iCarros não têm integração de sync, ver
// src/services/platform-sync.ts). Nunca usar veiculos.publicado_* como fonte
// de verdade. Webmotors/NaPista vivem em estoque_publicacoes (status
// 'publicado'/'despublicado'/'error' — conferido ao vivo em 15/09/2026);
// Mercado Livre tem tabela própria, ml_listings (status 'active'/'closed'/
// 'blocked'), não passa por estoque_publicacoes.
const PORTAIS_ESTOQUE_PUBLICACOES = [
  { slug: 'webmotors', label: 'Webmotors' },
  { slug: 'napista', label: 'NaPista' },
]
const STATUS_PUBLICADO_PORTAIS = ['publicado']
const STATUS_PUBLICADO_ML = ['active']

function diasEmEstoque(dateString: string) {
  if (!dateString) return 0
  return Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24))
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

export function RelatorioEstoque() {
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [publicacoesPorVeiculo, setPublicacoesPorVeiculo] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('disponivel')
  const [marcaFilter, setMarcaFilter] = useState('todas')
  const [diasFilter, setDiasFilter] = useState('todos')

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      let query = supabase
        .from('veiculos')
        .select(
          'id, marca, modelo, versao, ano_fabricacao, ano_modelo, placa, preco_venda, status, created_at',
        )
      if (statusFilter !== 'todos') query = query.eq('status', statusFilter)

      const { data: veicsData } = await query
      setVeiculos(veicsData || [])

      const ids = (veicsData || []).map((v) => v.id)
      if (ids.length > 0) {
        const [{ data: pubsData }, { data: mlData }] = await Promise.all([
          supabase
            .from('estoque_publicacoes')
            .select('veiculo_id, platform, status')
            .in('veiculo_id', ids)
            .in('status', STATUS_PUBLICADO_PORTAIS),
          supabase
            .from('ml_listings')
            .select('veiculo_id, status')
            .in('veiculo_id', ids)
            .in('status', STATUS_PUBLICADO_ML),
        ])

        const map: Record<string, string[]> = {}
        ;(pubsData || []).forEach((p) => {
          if (!map[p.veiculo_id]) map[p.veiculo_id] = []
          map[p.veiculo_id].push(p.platform)
        })
        ;(mlData || []).forEach((p) => {
          if (!map[p.veiculo_id]) map[p.veiculo_id] = []
          map[p.veiculo_id].push('mercadolivre')
        })
        setPublicacoesPorVeiculo(map)
      } else {
        setPublicacoesPorVeiculo({})
      }

      setLoading(false)
    }

    loadData()
  }, [statusFilter])

  const marcasDisponiveis = useMemo(
    () => Array.from(new Set(veiculos.map((v) => v.marca).filter(Boolean))).sort(),
    [veiculos],
  )

  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter((v) => {
      if (marcaFilter !== 'todas' && v.marca !== marcaFilter) return false
      const dias = diasEmEstoque(v.created_at)
      if (diasFilter === 'ate15' && dias > 15) return false
      if (diasFilter === '16a30' && (dias <= 15 || dias > 30)) return false
      if (diasFilter === '31a60' && (dias <= 30 || dias > 60)) return false
      if (diasFilter === 'mais60' && dias <= 60) return false
      return true
    })
  }, [veiculos, marcaFilter, diasFilter])

  const totalVeiculos = veiculosFiltrados.length
  const valorTotal = veiculosFiltrados.reduce((acc, v) => acc + (v.preco_venda || 0), 0)
  const diasMedio =
    totalVeiculos > 0
      ? Math.round(
          veiculosFiltrados.reduce((acc, v) => acc + diasEmEstoque(v.created_at), 0) /
            totalVeiculos,
        )
      : 0
  const parados30 = veiculosFiltrados.filter((v) => diasEmEstoque(v.created_at) > 30).length

  const porMarca = useMemo(() => {
    const grupos: Record<string, { count: number; valor: number }> = {}
    veiculosFiltrados.forEach((v) => {
      const marca = v.marca || 'Sem marca'
      if (!grupos[marca]) grupos[marca] = { count: 0, valor: 0 }
      grupos[marca].count += 1
      grupos[marca].valor += v.preco_venda || 0
    })
    return Object.entries(grupos).sort((a, b) => b[1].count - a[1].count)
  }, [veiculosFiltrados])

  const porPortal = useMemo(() => {
    const portais = [
      ...PORTAIS_ESTOQUE_PUBLICACOES,
      { slug: 'mercadolivre', label: 'Mercado Livre' },
    ]
    return portais.map((portal) => ({
      ...portal,
      count: veiculosFiltrados.filter((v) =>
        (publicacoesPorVeiculo[v.id] || []).includes(portal.slug),
      ).length,
    }))
  }, [veiculosFiltrados, publicacoesPorVeiculo])

  const exportarCSV = () => {
    const headers = [
      'Marca',
      'Modelo',
      'Ano',
      'Placa',
      'Preço',
      'Dias em estoque',
      'Status',
      'Portais',
    ]
    const linhas = veiculosFiltrados.map((v) => [
      v.marca || '',
      v.modelo || '',
      v.ano_modelo || v.ano_fabricacao || '',
      v.placa || '',
      v.preco_venda || 0,
      diasEmEstoque(v.created_at),
      STATUS_LABEL[v.status] || v.status || '',
      (publicacoesPorVeiculo[v.id] || []).join(' + ') || 'Nenhum',
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...linhas]
        .map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', 'relatorio_estoque.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <p className="text-slate-500 text-sm">
          Acompanhe o pátio: valor, tempo parado e publicação.
        </p>

        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-white">
              <Car className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="vendido">Vendido</SelectItem>
              <SelectItem value="devolvido">Devolvido</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="todos">Todos os status</SelectItem>
            </SelectContent>
          </Select>

          <Select value={marcaFilter} onValueChange={setMarcaFilter}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as marcas</SelectItem>
              {marcasDisponiveis.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={diasFilter} onValueChange={setDiasFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <Clock3 className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Dias parado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Qualquer tempo</SelectItem>
              <SelectItem value="ate15">Até 15 dias</SelectItem>
              <SelectItem value="16a30">16 a 30 dias</SelectItem>
              <SelectItem value="31a60">31 a 60 dias</SelectItem>
              <SelectItem value="mais60">Mais de 60 dias</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Veículos</p>
                    <h3 className="text-2xl font-bold text-slate-800">{totalVeiculos}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Valor do Pátio</p>
                    <h3 className="text-xl font-bold text-slate-800">
                      {formatCurrency(valorTotal)}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <Clock3 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Dias Médio</p>
                    <h3 className="text-2xl font-bold text-slate-800">{diasMedio}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Parados +30 dias</p>
                    <h3 className="text-2xl font-bold text-slate-800">{parados30}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Por Marca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {porMarca.length === 0 && (
                  <p className="text-sm text-slate-400">Nenhum veículo no filtro selecionado.</p>
                )}
                {porMarca.map(([marca, dados]) => {
                  const max = porMarca[0]?.[1].count || 1
                  return (
                    <div key={marca} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-28 shrink-0 truncate">{marca}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${(dados.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-8 text-right">
                        {dados.count}
                      </span>
                      <span className="text-xs text-slate-400 w-24 text-right">
                        {formatCurrency(dados.valor)}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Publicado nos Portais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-slate-400 -mt-1 mb-2">
                  Contagem real por status de publicação, não pelo campo de cadastro do veículo.
                </p>
                {porPortal.map((portal) => {
                  const max = totalVeiculos || 1
                  return (
                    <div key={portal.slug} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-32 shrink-0 truncate">
                        {portal.label}
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full"
                          style={{ width: `${(portal.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-8 text-right">
                        {portal.count}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
