import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Share2, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react'
import RedesSociais from './RedesSociais'
import SocialComments from './SocialComments'
import { SocialApprovalDashboard } from '@/components/admin/marketing/SocialApprovalDashboard'
import { IdeiasSociais } from '@/components/admin/marketing/IdeiasSociais'

// Central de Redes Sociais (14/08/2026, pedido da Adriana) — unifica 3 telas
// que já existiam espalhadas em itens de menu diferentes (Redes Sociais,
// Moderador de Posts, e a aba "social" dentro de Marketing) num só lugar com
// cabeçalho único, mais a aba nova de Ideias com IA. Não duplica lógica: cada
// aba reaproveita o componente original, só embutido em vez de ser página
// própria.
export default function CentralSocial() {
  const [tab, setTab] = useState('publicacoes')

  return (
    <div className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-blue-600" />
          Central de Redes Sociais
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Publicações, aprovações, comentários e ideias de conteúdo — tudo num só lugar.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="bg-white border rounded-lg p-1 h-auto flex flex-wrap shadow-sm w-fit shrink-0">
          <TabsTrigger
            value="publicacoes"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Share2 className="w-4 h-4 mr-2" /> Publicações
          </TabsTrigger>
          <TabsTrigger
            value="aprovacoes"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovações
          </TabsTrigger>
          <TabsTrigger
            value="comentarios"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Comentários
          </TabsTrigger>
          <TabsTrigger
            value="ideias"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Ideias com IA
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="publicacoes"
          className="flex-1 min-h-0 mt-4 bg-white rounded-lg border overflow-hidden"
        >
          <RedesSociais embedded />
        </TabsContent>
        <TabsContent value="aprovacoes" className="mt-4 overflow-y-auto">
          <SocialApprovalDashboard />
        </TabsContent>
        <TabsContent value="comentarios" className="mt-4 overflow-y-auto">
          <SocialComments embedded />
        </TabsContent>
        <TabsContent value="ideias" className="mt-4 overflow-y-auto">
          <IdeiasSociais />
        </TabsContent>
      </Tabs>
    </div>
  )
}
