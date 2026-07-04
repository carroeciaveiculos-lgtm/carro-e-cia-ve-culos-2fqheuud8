import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, MessageSquare, Megaphone, FileText } from 'lucide-react'
import { AdsAgentChat } from '@/components/admin/ads/AdsAgentChat'
import { CampaignPanel } from '@/components/admin/ads/CampaignPanel'
import { AdCopyGenerator } from '@/components/admin/ads/AdCopyGenerator'

export default function AdsManager() {
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" /> Gestão de Anúncios IA
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie campanhas Google e Meta Ads com assistência de inteligência artificial.
        </p>
      </div>

      <Tabs defaultValue="agent" className="space-y-6">
        <TabsList className="bg-white border rounded-lg p-1 h-auto flex flex-wrap shadow-sm">
          <TabsTrigger
            value="agent"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Agente IA
          </TabsTrigger>
          <TabsTrigger
            value="google"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Megaphone className="w-4 h-4 mr-2" /> Google Ads
          </TabsTrigger>
          <TabsTrigger
            value="meta"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Megaphone className="w-4 h-4 mr-2" /> Meta Ads
          </TabsTrigger>
          <TabsTrigger
            value="copy"
            className="py-2.5 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <FileText className="w-4 h-4 mr-2" /> Criador de Anúncios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent">
          <AdsAgentChat />
        </TabsContent>
        <TabsContent value="google">
          <CampaignPanel platform="google" />
        </TabsContent>
        <TabsContent value="meta">
          <CampaignPanel platform="meta" />
        </TabsContent>
        <TabsContent value="copy">
          <AdCopyGenerator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
