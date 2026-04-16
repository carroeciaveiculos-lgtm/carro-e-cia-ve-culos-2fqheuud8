import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Globe, Image as ImageIcon, FileText, MessageSquare, Layout } from 'lucide-react'

export default function SiteManager() {
  const [activeTab, setActiveTab] = useState('geral')

  const teamPhotos = [
    {
      name: 'Adriana',
      url: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Adriana%20foto%20profissional.jpeg',
    },
    {
      name: 'Jéssica',
      url: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Ljessica%20foto%20profissional.jpeg',
    },
    {
      name: 'Luiz Fernando',
      url: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Luiz%20Fernando%20foto%20profissional.jpeg',
    },
    {
      name: 'Roberto Junior',
      url: 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Roberto%20Junior%20foto%20profissional.jpeg',
    },
  ]

  const partnerLogos = [
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Bradesco.png',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/BV.png',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/PORTO%20BANK%20LOGO.png',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/Safra.jpeg',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Parceiros/santander.png',
  ]

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" /> Gerenciador do Site
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle banners, textos, parceiros e configurações de SEO.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0">
          <div className="flex flex-col gap-1">
            <Button
              variant={activeTab === 'geral' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('geral')}
            >
              Dados da Loja & SEO
            </Button>
            <Button
              variant={activeTab === 'imagens' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('imagens')}
            >
              Galeria & Mídias
            </Button>
            <Button
              variant={activeTab === 'conteudo' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('conteudo')}
            >
              Páginas & Equipe
            </Button>
            <Button
              variant={activeTab === 'depoimentos' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('depoimentos')}
            >
              Depoimentos
            </Button>
            <Button
              variant={activeTab === 'scripts' ? 'secondary' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab('scripts')}
            >
              Scripts & Tags
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 min-h-[500px]">
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Layout className="w-5 h-5" /> Configurações Gerais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Loja</Label>
                  <Input defaultValue="Carro e Cia Veículos" />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input defaultValue="17.125.199/0001-87" />
                </div>
                <div>
                  <Label>Telefone Principal</Label>
                  <Input defaultValue="(34) 99994-8428" />
                </div>
                <div>
                  <Label>E-mail de Contato</Label>
                  <Input defaultValue="lgacomerciodeveiculos@gmail.com" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Endereço Completo</Label>
                  <Input defaultValue="Av. Guilherme Ferreira, 1131 - São Benedito, Uberaba - MG" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Meta Description (SEO)</Label>
                  <Textarea defaultValue="Venda seu carro com segurança. Consignação de veículos em Uberaba." />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'imagens' && (
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5" /> Bancos Parceiros
                </h3>
                <div className="flex flex-wrap gap-4">
                  {partnerLogos.map((url, i) => (
                    <div
                      key={i}
                      className="w-24 h-16 border rounded-lg p-2 flex items-center justify-center bg-slate-50"
                    >
                      <img
                        src={url}
                        alt="Partner Logo"
                        className="max-w-full max-h-full object-contain mix-blend-multiply"
                      />
                    </div>
                  ))}
                  <div className="w-24 h-16 border border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400 text-xs text-center p-2">
                    + Adicionar
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5" /> Fachada e Logo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border p-2 rounded-lg text-center">
                    <img
                      src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Logos/logo%20carro%20e%20cia.png"
                      className="h-20 mx-auto object-contain mb-2"
                      alt="Logo"
                    />
                    <p className="text-xs text-slate-500">Logo Principal</p>
                  </div>
                  <div className="border p-2 rounded-lg text-center">
                    <img
                      src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/fachada%20da%20loja.jpeg"
                      className="h-20 mx-auto object-cover rounded mb-2"
                      alt="Fachada"
                    />
                    <p className="text-xs text-slate-500">Foto Fachada</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conteudo' && (
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" /> Equipe Carro e Cia
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {teamPhotos.map((member, i) => (
                    <Card key={i} className="overflow-hidden">
                      <img
                        src={member.url}
                        alt={member.name}
                        className="w-full h-32 object-cover object-top"
                      />
                      <div className="p-2 text-center text-sm font-bold text-slate-700 bg-slate-50">
                        {member.name}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <Label>Texto Página "Sobre Nós"</Label>
                <Textarea
                  className="h-32 mt-2"
                  defaultValue="Mais de 20 anos de confiança. Conectar vendedores e compradores com segurança é a nossa missão."
                />
              </div>
            </div>
          )}

          {activeTab === 'depoimentos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Depoimentos de Clientes
                </h3>
                <Button size="sm">Adicionar Depoimento</Button>
              </div>
              <Card>
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                  <div>
                    <p className="font-bold">Maria Oliveira</p>
                    <p className="text-sm text-slate-600">
                      "Vendi meu carro em menos de uma semana! Equipe nota 10."
                    </p>
                  </div>
                  <div className="ml-auto text-amber-500 font-bold whitespace-nowrap">★★★★★</div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" /> Tags de Rastreamento
              </h3>
              <p className="text-sm text-slate-500">
                As tags abaixo já estão integradas no código fonte da plataforma de forma otimizada
                para SEO.
              </p>
              <div className="grid gap-4">
                <div>
                  <Label>Google Analytics (GA4) ID</Label>
                  <Input defaultValue="G-7NCHPJ2SLT" readOnly className="bg-slate-50 font-mono" />
                </div>
                <div>
                  <Label>Google Tag Manager (GTM) ID</Label>
                  <Input defaultValue="GTM-N7LFK82W" readOnly className="bg-slate-50 font-mono" />
                </div>
                <div>
                  <Label>Clarity ID</Label>
                  <Input defaultValue="wb6vgqmca2" readOnly className="bg-slate-50 font-mono" />
                </div>
                <div>
                  <Label>Google Search Console</Label>
                  <Input
                    defaultValue="U4M2M0e2Nz-6Zl4r_lpDH0y8n7f3PVH785u50RxyVYI"
                    readOnly
                    className="bg-slate-50 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
