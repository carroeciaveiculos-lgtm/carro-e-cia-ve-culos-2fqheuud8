import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Portais() {
  const ativos = [
    { nome: 'WebMotors', cnpj: '10.196.974/0001-46', plano: 'Básico (9999)' },
    { nome: 'iCarros', email: 'carroecia@terra.com.br', plano: '1ª Prior.(3) / 3ª Prior.(12)' },
    {
      nome: 'Mercado Livre',
      email: 'carroeciaclientes@gmail.com',
      plano: 'Diamante(11) / Ouro(6)',
    },
    { nome: 'NaPista', email: 'carroecia@terra.com.br', plano: '1ª Prior.(999)' },
  ]
  const disponiveis = ['OLX', 'Usadosbr', 'Autoline', 'Mobiauto', 'Chaves na Mão', 'SóCarrão']

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">PORTAIS INTEGRADOS</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {ativos.map((p) => (
          <Card key={p.nome} className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b pb-4">
              <CardTitle className="text-lg text-[#0D47A1] font-bold">{p.nome}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 bg-white">
              <div className="text-sm">
                <p className="text-gray-600">
                  <strong>Conta:</strong> <span className="text-gray-900">{p.email || p.cnpj}</span>
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Plano:</strong> <span className="text-gray-900">{p.plano}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  size="sm"
                  className="bg-[#1976D2] hover:bg-[#1565C0] w-full text-[10px] uppercase font-bold tracking-wider"
                >
                  Atualizar Plano
                </Button>
                <Button
                  size="sm"
                  className="bg-[#2E7D32] hover:bg-[#1B5E20] w-full text-[10px] uppercase font-bold tracking-wider"
                >
                  Enviar Todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[#C62828] border-[#C62828] hover:bg-[#C62828]/10 w-full text-[10px] uppercase font-bold tracking-wider"
                >
                  Editar Senha
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-gray-500 border-gray-300 hover:bg-red-50 hover:text-red-600 w-full text-[10px] uppercase font-bold tracking-wider"
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">DISPONÍVEIS PARA ADICIONAR</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {disponiveis.map((d) => (
          <Card
            key={d}
            className="flex flex-col items-center justify-center p-6 shadow-sm border-dashed border-gray-300 bg-transparent hover:bg-white transition-colors cursor-pointer group"
          >
            <p className="font-bold text-gray-400 group-hover:text-[#1565C0] transition-colors mb-3">
              {d}
            </p>
            <Button size="sm" variant="outline" className="w-full text-xs">
              + Adicionar
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
