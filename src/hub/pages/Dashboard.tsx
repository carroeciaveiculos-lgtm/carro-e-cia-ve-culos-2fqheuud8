import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Palette,
  Code,
  Image as ImageIcon,
  AlertCircle,
  Car,
  Users,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

export default function DashboardPage() {
  const isSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('hub.')
  const basePath = isSubdomain ? '' : '/hub'

  const [metrics, setMetrics] = useState({
    veiculosAtivos: 0,
    veiculosSemFotos: 0,
    leadsPendentes: 0,
    novosLeadsHoje: 0,
  })

  useEffect(() => {
    async function loadMetrics() {
      // Veículos Ativos
      const { count: vAtivos } = await supabase
        .from('veiculos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disponivel')

      // Veículos sem fotos
      const { data: vSemFotos } = await supabase
        .from('veiculos')
        .select('fotos')
        .eq('status', 'disponivel')
      const countSemFotos = vSemFotos?.filter((v) => !v.fotos || v.fotos.length === 0).length || 0

      // Leads Pendentes
      const { count: lPendentes } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'novo')

      // Novos Leads Hoje
      const today = new Date().toISOString().split('T')[0]
      const { count: lHoje } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      setMetrics({
        veiculosAtivos: vAtivos || 0,
        veiculosSemFotos: countSemFotos,
        leadsPendentes: lPendentes || 0,
        novosLeadsHoje: lHoje || 0,
      })
    }
    loadMetrics()
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Dashboard e KPIs</h1>
        <p className="mt-2 text-gray-500">
          Bem-vindo ao centro de controle estratégico da Carro e Cia Veículos.
        </p>
      </div>

      {/* Gestão por Exceção (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-l-4 border-l-blue-600 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Veículos Ativos</p>
                <h3 className="text-3xl font-bold text-slate-800">{metrics.veiculosAtivos}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Car className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Veículos sem Foto</p>
                <h3 className="text-3xl font-bold text-amber-600">{metrics.veiculosSemFotos}</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            {metrics.veiculosSemFotos > 0 && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                Atenção requerida: Veículos sem foto vendem 60% menos.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Leads Pendentes</p>
                <h3 className="text-3xl font-bold text-red-600">{metrics.leadsPendentes}</h3>
              </div>
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            {metrics.leadsPendentes > 0 && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                Você tem clientes esperando atendimento!
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Leads Hoje</p>
                <h3 className="text-3xl font-bold text-green-600">{metrics.novosLeadsHoje}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Módulos do Sistema</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to={`${basePath}/branding`}
          className="block focus:outline-none focus:ring-2 focus:ring-[#CC0000] rounded-xl"
        >
          <Card className="h-full hover:border-[#CC0000] hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 border-l-[#CC0000]">
            <CardHeader className="pb-2">
              <Palette className="w-8 h-8 text-[#CC0000] mb-2" />
              <CardTitle>Branding e Identidade</CardTitle>
              <CardDescription>
                Gerencie o logotipo, cores primárias e favicon do seu site globalmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 mt-2 border border-green-200">
                Ativo e Configurado
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link
          to={`${basePath}/scripts`}
          className="block focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] rounded-xl"
        >
          <Card className="h-full hover:border-[#1A1A1A] hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 border-l-[#1A1A1A]">
            <CardHeader className="pb-2">
              <Code className="w-8 h-8 text-[#1A1A1A] mb-2" />
              <CardTitle>Gestor de Scripts</CardTitle>
              <CardDescription>
                Injete códigos do Google Analytics, Pixels, GTM e tags customizadas de forma segura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 mt-2 border border-green-200">
                Ativo e Configurado
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link
          to={`${basePath}/media`}
          className="block focus:outline-none focus:ring-2 focus:ring-[#CC0000] rounded-xl"
        >
          <Card className="h-full hover:border-[#CC0000] hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 border-l-[#CC0000] bg-white">
            <CardHeader className="pb-2">
              <ImageIcon className="w-8 h-8 text-[#CC0000] mb-2" />
              <CardTitle className="text-gray-900">Media Center</CardTitle>
              <CardDescription>
                Otimização automática de imagens (WebP), redimensionamento e galeria integrada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 mt-2 border border-green-200">
                Ativo e Configurado
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
