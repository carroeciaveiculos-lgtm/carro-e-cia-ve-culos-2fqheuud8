import { Link } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'

export default function PoliticaPrivacidade() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl animate-fade-in-up">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-full">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Política de Privacidade</h1>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introdução</h2>
          <p className="text-muted-foreground leading-relaxed">
            Bem-vindo à Carro e Cia Veículos. Esta Política de Privacidade descreve como coletamos,
            usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nosso
            site (<strong>https://carroeciaveiculos.goskip.app</strong>) e nossos serviços, em
            conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Dados que Coletamos</h2>
          <p className="text-muted-foreground mb-4">
            Coletamos as seguintes informações para fornecer nossos serviços de forma eficiente:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Dados de Contato:</strong> Nome completo, endereço de e-mail e número de
              telefone ou WhatsApp.
            </li>
            <li>
              <strong>Dados do Veículo:</strong> Informações sobre o veículo que você deseja vender,
              avaliar ou deixar em consignação (placa, chassi, renavam, marca, modelo, ano,
              quilometragem, etc.).
            </li>
            <li>
              <strong>Dados de Navegação:</strong> Endereço IP, tipo de navegador, páginas
              visitadas, interações no site e tempo de permanência, coletados através de cookies
              essenciais.
            </li>
            <li>
              <strong>Dados Financeiros:</strong> Informações fornecidas exclusivamente para
              simulações de financiamento, processadas de forma segura por nossas instituições
              financeiras parceiras.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Como Usamos seus Dados</h2>
          <p className="text-muted-foreground mb-4">
            Utilizamos suas informações pessoais estritamente para os seguintes propósitos
            comerciais:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Responder rapidamente a solicitações de contato, dúvidas e agendamentos.</li>
            <li>Fornecer avaliações precisas de veículos e apresentar propostas de negociação.</li>
            <li>
              Processar simulações de financiamento e auxiliar na emissão de contratos de
              consignação.
            </li>
            <li>
              Melhorar continuamente a experiência de navegação, segurança e funcionalidades de
              nosso site.
            </li>
            <li>
              Enviar comunicações relevantes, como status de propostas e novidades do estoque
              (apenas mediante o seu consentimento).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            4. Compartilhamento de Dados
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            A Carro e Cia Veículos <strong>não vende ou aluga</strong> seus dados pessoais a
            terceiros sob nenhuma circunstância. O compartilhamento de informações ocorre
            exclusivamente com parceiros essenciais para a prestação de nossos serviços, tais como:
            instituições financeiras (para análise de crédito), plataformas de assinatura eletrônica
            de contratos, portais de classificados de veículos (quando devidamente autorizado) e
            serviços confiáveis de infraestrutura em nuvem. Todos os parceiros estão sujeitos a
            rigorosas obrigações contratuais de proteção de dados.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            5. Armazenamento e Segurança
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Adotamos medidas técnicas, administrativas e robustas de segurança da informação aptas a
            proteger seus dados pessoais contra acessos não autorizados, perda, alteração,
            destruição ou qualquer forma de tratamento inadequado. Suas informações são armazenadas
            em servidores seguros com criptografia moderna e o acesso é estritamente restrito aos
            profissionais autorizados da nossa equipe.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Seus Direitos (LGPD)</h2>
          <p className="text-muted-foreground mb-4">
            Como titular dos dados, a Lei Geral de Proteção de Dados assegura a você os seguintes
            direitos:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Confirmar a existência de tratamento dos seus dados pessoais por nossa empresa.</li>
            <li>Solicitar o acesso completo aos dados que armazenamos sobre você.</li>
            <li>
              Solicitar a correção de dados incompletos, inexatos ou desatualizados em nosso
              sistema.
            </li>
            <li>
              Requerer a anonimização, bloqueio ou eliminação de dados considerados desnecessários
              ou tratados em desconformidade com a lei.
            </li>
            <li>
              Revogar o seu consentimento de comunicação a qualquer momento, de forma simples e
              imediata.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Fale Conosco</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Para exercer seus direitos previstos na legislação vigente ou caso tenha qualquer
            dúvida, sugestão ou reclamação sobre nossas práticas de privacidade, entre em contato
            diretamente conosco:
          </p>
          <div className="bg-muted p-6 rounded-xl border border-border/50 text-foreground shadow-sm">
            <p className="mb-3 flex items-center gap-2">
              <span className="font-semibold w-24">E-mail:</span>
              <a
                href="mailto:contato@carroeciaveiculos.goskip.app"
                className="text-primary hover:underline transition-colors"
              >
                contato@carroeciaveiculos.goskip.app
              </a>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold w-24">WhatsApp:</span>
              <a
                href="https://wa.me/5534999484285"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline transition-colors"
              >
                (34) 99948-4285
              </a>
            </p>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border flex justify-start">
        <Link
          to="/"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Página Inicial
        </Link>
      </div>
    </div>
  )
}
