import { SEO } from '@/components/SEO'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PoliticaPrivacidade() {
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto animate-in fade-in duration-500">
      <SEO
        title="Política de Privacidade | Carro e Cia Veículos"
        description="Nossa política de privacidade detalha como coletamos, usamos e protegemos seus dados pessoais de acordo com a LGPD."
      />

      <Link
        to="/"
        className="inline-flex items-center text-primary hover:underline mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para a página inicial
      </Link>

      <div className="bg-card/30 border border-border rounded-xl p-6 md:p-10 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-foreground tracking-tight">
          Política de Privacidade
        </h1>

        <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground space-y-8">
          <p className="font-medium text-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introdução</h2>
            <p className="leading-relaxed">
              A Carro e Cia Veículos respeita a sua privacidade e está comprometida em proteger os
              seus dados pessoais. Esta Política de Privacidade informará como cuidamos dos seus
              dados pessoais quando você visita o nosso site e informará sobre os seus direitos de
              privacidade e como a lei o protege.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Os dados que coletamos sobre você
            </h2>
            <p className="mb-4 leading-relaxed">
              Dados pessoais significam qualquer informação sobre um indivíduo a partir da qual essa
              pessoa possa ser identificada. Podemos coletar, usar, armazenar e transferir
              diferentes tipos de dados pessoais sobre você, que agrupamos da seguinte forma:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-foreground">Dados de Identidade:</strong> inclui nome,
                sobrenome, nome de usuário ou identificador semelhante.
              </li>
              <li>
                <strong className="text-foreground">Dados de Contato:</strong> inclui endereço de
                e-mail e números de telefone.
              </li>
              <li>
                <strong className="text-foreground">Dados Técnicos:</strong> inclui endereço de
                protocolo de internet (IP), seus dados de login, tipo e versão do navegador,
                configuração e localização do fuso horário, tipos e versões de plug-in do navegador,
                sistema operacional e plataforma e outras tecnologias nos dispositivos que você usa
                para acessar este site.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Como usamos seus dados pessoais
            </h2>
            <p className="mb-4 leading-relaxed">
              Só usaremos seus dados pessoais quando a lei nos permitir. Mais comumente, usaremos
              seus dados pessoais nas seguintes circunstâncias:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                Onde precisamos executar o contrato que estamos prestes a celebrar ou celebramos com
                você (ex: consignação, simulação de financiamento).
              </li>
              <li>
                Onde é necessário para nossos interesses legítimos (ou de terceiros) e seus
                interesses e direitos fundamentais não se sobrepõem a esses interesses.
              </li>
              <li>Onde precisamos cumprir uma obrigação legal ou regulatória.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Segurança de dados</h2>
            <p className="leading-relaxed">
              Implementamos medidas de segurança apropriadas para evitar que seus dados pessoais
              sejam acidentalmente perdidos, usados ou acessados de forma não autorizada, alterados
              ou divulgados. Além disso, limitamos o acesso aos seus dados pessoais aos
              funcionários, agentes, contratados e outros terceiros que tenham necessidade comercial
              de conhecê-los.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Seus direitos legais</h2>
            <p className="leading-relaxed">
              Sob certas circunstâncias, você tem direitos sob as leis de proteção de dados em
              relação aos seus dados pessoais, incluindo o direito de solicitar acesso, correção,
              exclusão, restrição, transferência ou de objetar ao processamento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Contato</h2>
            <p className="leading-relaxed">
              Para quaisquer questões relacionadas a esta Política de Privacidade ou solicitações
              sobre seus dados, entre em contato conosco através dos nossos canais de atendimento
              oficiais disponíveis no site, ou diretamente pelo telefone e WhatsApp.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
