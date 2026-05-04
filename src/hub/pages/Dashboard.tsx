import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Code, Image as ImageIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Visão Geral</h1>
        <p className="mt-2 text-gray-500">
          Bem-vindo ao centro de controle Hub da Carro e Cia Veículos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/branding"
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
          to="/scripts"
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
          to="/media"
          className="block focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-xl"
        >
          <Card className="h-full hover:border-gray-400 transition-all duration-300 cursor-pointer border-l-4 border-l-gray-300 bg-gray-50/50">
            <CardHeader className="pb-2">
              <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
              <CardTitle className="text-gray-700">Media Center</CardTitle>
              <CardDescription>
                Otimização automática de imagens (WebP), redimensionamento e galeria integrada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 mt-2 border border-gray-200">
                Fase 2 (Preparando Infraestrutura)
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
