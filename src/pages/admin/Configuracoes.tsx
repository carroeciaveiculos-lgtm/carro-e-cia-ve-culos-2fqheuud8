import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'

export default function Configuracoes() {
  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">CONFIGURAÇÕES GERAIS</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start bg-[#1565C0]/10 text-[#1565C0] font-bold"
          >
            Dados da Empresa
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-600">
            Meus Dados (Login)
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-600">
            Alterar Senha
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-600">
            Textos Padrões
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-600">
            Facebook / Instagram
          </Button>
        </div>

        <div className="lg:col-span-3">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b pb-4">
              <CardTitle className="text-lg text-[#0D47A1]">Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Nome Fantasia
                </Label>
                <Input defaultValue="Carro e Cia Veículos" className="bg-gray-50 font-medium" />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">CNPJ</Label>
                <Input defaultValue="17.125.199/0001-87" className="bg-gray-50 font-medium" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Endereço Completo
                </Label>
                <Input
                  defaultValue="Av. Guilherme Ferreira, 1119"
                  className="bg-gray-50 font-medium"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Bairro / Cidade
                </Label>
                <Input
                  defaultValue="São Benedito - Uberaba/MG"
                  className="bg-gray-50 font-medium"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">CEP</Label>
                <Input defaultValue="38022-200" className="bg-gray-50 font-medium" />
              </div>
              <div className="border-t col-span-1 md:col-span-2 pt-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    WhatsApp Comercial
                  </Label>
                  <Input defaultValue="5534999484285" className="bg-gray-50 font-medium" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    E-mail Comercial
                  </Label>
                  <Input
                    defaultValue="lgacomerciodeveiculos@gmail.com"
                    className="bg-gray-50 font-medium"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Instagram (@)
                  </Label>
                  <Input defaultValue="@carroecia02" className="bg-gray-50 font-medium" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Facebook
                  </Label>
                  <Input
                    defaultValue="carroeciaosmelhoresveiculos"
                    className="bg-gray-50 font-medium"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end mt-6">
            <Button className="bg-[#1976D2] hover:bg-[#1565C0] px-8">
              <Save className="w-4 h-4 mr-2" /> Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
