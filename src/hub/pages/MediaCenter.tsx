import { Card, CardContent } from '@/components/ui/card'
import { Image as ImageIcon, UploadCloud, Settings, Database, ArrowRight } from 'lucide-react'

export default function MediaCenterPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Media Center Inteligente</h1>
        <p className="mt-2 text-gray-500 text-lg">
          A nova geração de armazenamento otimizado do seu ecossistema digital.
        </p>
      </div>

      <Card className="border-dashed border-[3px] border-gray-200 bg-gray-50/50 shadow-none overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 opacity-50"></div>

        <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 z-10 relative">
              <ImageIcon className="w-12 h-12 text-[#CC0000]" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200 animate-pulse">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-sm font-bold uppercase tracking-wider rounded-full mb-2">
              Fase 2 em preparação
            </span>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Otimização Automática a Caminho
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
              Já construímos a infraestrutura de dados. Em breve, envios para este painel serão
              convertidos automaticamente para o formato WebP, oferecendo máxima performance sem
              perda de qualidade visual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 w-full max-w-4xl">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:border-gray-300 transition-colors">
              <div className="bg-gray-50 p-3 rounded-full mb-4">
                <UploadCloud className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Gestão Centralizada</h3>
              <p className="text-sm text-gray-500">
                Faça o upload de banners, fotos de veículos e ativos do blog em uma única biblioteca
                acessível.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:border-[#CC0000] transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-[#CC0000]/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <div className="bg-red-50 p-3 rounded-full mb-4 relative z-10">
                <Settings className="w-6 h-6 text-[#CC0000]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 relative z-10">Conversão WebP (Edge)</h3>
              <p className="text-sm text-gray-500 relative z-10">
                Ao fazer o upload, a imagem será processada em background (edge functions) para
                gerar versões leves instantaneamente.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:border-gray-300 transition-colors">
              <div className="bg-gray-50 p-3 rounded-full mb-4">
                <Database className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Reaproveitamento</h3>
              <p className="text-sm text-gray-500">
                Economize seu storage do Supabase utilizando as mesmas imagens já tratadas em
                diversas páginas do seu site.
              </p>
            </div>
          </div>

          <div className="pt-8 flex items-center text-sm font-medium text-gray-400 group">
            <span className="mr-2">
              A infraestrutura de tabelas já está rodando no banco de dados
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
