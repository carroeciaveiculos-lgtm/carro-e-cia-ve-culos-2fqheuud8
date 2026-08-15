import { SEO } from '@/components/SEO'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export default function Termos() {
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto animate-in fade-in duration-500">
      <SEO
        title="Termos de Uso | Carro e Cia Veículos"
        description="Termos de uso da plataforma Carro e Cia Veículos."
      />
      <Link
        to="/"
        className="inline-flex items-center text-primary hover:underline mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para a página inicial
      </Link>
      <div className="bg-card border border-border rounded-xl p-8 md:p-12 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 border-b pb-8">
          <div className="bg-primary/10 p-4 rounded-full flex-shrink-0">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Termos de Uso
          </h1>
        </div>
        <div className="prose prose-slate dark:prose-invert max-w-none text-justify text-foreground space-y-6">
          <div className="text-left space-y-1 mb-8">
            <p className="m-0 font-semibold">TRANSLUGA ADMINISTRACAO DE VEICULOS LTDA</p>
            <p className="m-0">CNPJ: 10.196.974/0001-46</p>
            <p className="m-0">AV GUILHERME FERREIRA, 1119 - São Benedito</p>
            <p className="m-0">Uberaba - MG · CEP 38.022-200</p>
          </div>
          <h2 className="text-xl font-bold text-left">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar o website da Carro e Cia Veículos, você concorda integralmente com
            estes Termos de Uso. Caso não concorde com qualquer disposição aqui contida, não utilize
            este site.
          </p>
          <h2 className="text-xl font-bold text-left pt-4">2. Uso da Plataforma</h2>
          <p>
            Este website tem como objetivo principal a apresentação de veículos disponíveis para
            venda, consignação e serviços relacionados. O usuário compromete-se a utilizar a
            plataforma apenas para fins legítimos.
          </p>
          <h2 className="text-xl font-bold text-left pt-4">3. Informações dos Veículos</h2>
          <p>
            Todas as informações sobre veículos apresentadas neste site, incluindo preços,
            especificações e disponibilidade, estão sujeitas a alteração sem aviso prévio. As
            negociações comerciais finais só são válidas quando formalizadas por contrato assinado
            em nossa sede.
          </p>
          <h2 className="text-xl font-bold text-left pt-4">4. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo deste site, incluindo textos, imagens, logos e design, é propriedade da
            TRANSLUGA ADMINISTRACAO DE VEICULOS LTDA ou de seus parceiros, sendo protegido por leis
            de propriedade intelectual.
          </p>
          <h2 className="text-xl font-bold text-left pt-4">5. Limitação de Responsabilidade</h2>
          <p>
            A Carro e Cia Veículos não se responsabiliza por danos diretos ou indiretos decorrentes
            do uso ou impossibilidade de uso deste website, incluindo perdas de dados ou lucros
            cessantes.
          </p>
          <h2 className="text-xl font-bold text-left pt-4">6. Contato</h2>
          <p>
            Em caso de dúvidas sobre estes Termos de Uso, entre em contato através do telefone (34)
            3315-9400 ou pelo e-mail contato@carroeciamotors.com.br.
          </p>
        </div>
      </div>
    </div>
  )
}
