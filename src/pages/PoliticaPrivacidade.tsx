import { SEO } from '@/components/SEO'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PoliticaPrivacidade() {
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto animate-in fade-in duration-500">
      <SEO
        title="Política de Privacidade | Carro e Cia Veículos"
        description="Regulamento Interno de Privacidade, Termos de Uso e Cookies. Documentação de conformidade com a LGPD e diretrizes de plataforma do Meta."
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
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Regulamento Interno de Privacidade, Termos de Uso e Cookies
            </h1>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-justify text-foreground space-y-6">
          <div className="text-left space-y-1 mb-8">
            <p className="m-0">LGA COMÉRCIO DE VEÍCULOS LTDA</p>
            <p className="m-0">CARRO E CIA MOTORS</p>
            <p className="m-0">CNPJ: 17.125.199/0001-87</p>
            <p className="m-0 mt-4">REGULAMENTO INTERNO DE PRIVACIDADE, TERMOS DE USO E COOKIES</p>
            <p className="m-0 mt-4">
              Documentação de Conformidade com a LGPD e Diretrizes de Plataforma do Meta
            </p>
            <p className="m-0 mt-4">
              Responsável Técnica e Encarregada de Dados (DPO): Adriana Araújo
            </p>
            <p className="m-0">Contato: adriana.araujo@carroeciamotors.com.br</p>
            <p className="m-0">Fuso Horário e Localidade: Uberaba - MG, Brasil</p>
            <p className="m-0">Data de Publicação: Junho de 2026</p>
          </div>

          <p className="text-muted-foreground text-left">
            <br />
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-left pt-6">
            SEÇÃO 1: POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)
          </h2>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            1. Declaração de Abertura e Consentimento
          </h3>
          <p>
            A presente Política de Privacidade regula o tratamento de dados pessoais realizado pela
            LGA COMÉRCIO DE VEÍCULOS LTDA, pessoa jurídica de direito privado, inscrita sob o CNPJ
            nº 17.125.199/0001-87, operando comercialmente sob o nome fantasia CARRO E CIA MOTORS,
            com sede administrativa na Av. Guilherme Ferreira, nº 1131, Bairro São Benedito, Uberaba
            - MG, CEP 38022-200.
          </p>
          <p>
            Ao utilizar nosso website (https://www.carroeciamotors.com.br/), interagir com nosso
            sistema de CRM ou enviar mensagens para nosso assistente automatizado de vendas via
            WhatsApp Business API, você declara estar ciente e outorga seu consentimento livre,
            expresso e informado para a coleta e o processamento de seus dados pessoais em
            conformidade com as regras aqui dispostas [1.1.2].
          </p>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            2. Dados Pessoais Coletados
          </h3>
          <p>
            Para prover um atendimento eficiente e viabilizar a comercialização e financiamento de
            veículos, coletamos:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-justify">
            <li>
              Dados Cadastrais Básicos: Nome completo e número de telefone celular cadastrado no
              WhatsApp [4].
            </li>
            <li>
              Dados de Atendimento e Interações: Histórico completo de conversas mantido em nosso
              banco de dados, incluindo as interações geradas pelo nosso assistente de IA ("Luiz") e
              pelos consultores humanos da equipe de vendas [1.3.1, 4].
            </li>
            <li>
              Dados de Interesse de Negócio: Modelo do veículo de interesse, faixa de preço
              pretendida, modalidade de pagamento desejada e informações de veículos oferecidos para
              troca [1.3.1].
            </li>
            <li>
              Dados Técnicos de Navegação: Endereço IP, dados de cookies, tipo de navegador e
              registros de acesso à nossa plataforma web [4].
            </li>
          </ul>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            3. Finalidade do Tratamento de Dados
          </h3>
          <p>
            O tratamento de seus dados é balizado pelos princípios da finalidade, adequação e
            necessidade, conforme previstos pela Lei Geral de Proteção de Dados (LGPD):
          </p>
          <ul className="list-disc pl-6 space-y-2 text-justify">
            <li>
              Atendimento Automatizado por IA: Processar suas dúvidas de estoque, preços e condições
              através do modelo de inteligência artificial Gemini 3.5 Flash do Google, integrado de
              forma segura ao nosso fluxo de atendimento [1.3.1].
            </li>
            <li>
              Gerenciamento Interno (CRM): Registrar o histórico operacional de conversas no banco
              de dados hospedado no Supabase para garantir que nossos gerentes e consultores de
              vendas possam dar continuidade ao seu atendimento sem perdas de informações [1, 4].
            </li>
            <li>
              Propostas e Agendamentos: Viabilizar o envio de fotos, simulações prévias de
              financiamento bancário e agendar visitas presenciais ao nosso showroom na Av.
              Guilherme Ferreira, nº 1131 [1.3.1].
            </li>
          </ul>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            4. Compartilhamento de Dados com Parceiros e Processadores
          </h3>
          <p>
            A Carro e Cia Motors não comercializa e não cede seus dados pessoais a terceiros sob
            nenhuma hipótese. No entanto, para que nossos serviços digitais funcionem,
            compartilhamos seus dados com provedores globais de tecnologia que atuam como
            suboperadores de dados:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-justify">
            <li>
              Meta Platforms, Inc. (WhatsApp Cloud API): Canal oficial responsável pelo
              processamento e entrega segura das mensagens trafegadas [3].
            </li>
            <li>
              Google LLC (Gemini API): Infraestrutura de inteligência artificial responsável por ler
              as perguntas enviadas no chat e sugerir respostas personalizadas como SDR digital
              [1.3.1].
            </li>
            <li>
              Supabase, Inc. (Hospedagem em Nuvem): Infraestrutura de banco de dados e computação
              responsável por manter as informações armazenadas com criptografia [1].
            </li>
          </ul>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            5. Direitos do Titular dos Dados (LGPD)
          </h3>
          <p>
            Você, na qualidade de titular dos dados pessoais, tem o direito de solicitar a qualquer
            momento:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-justify">
            <li>A confirmação da existência do tratamento de seus dados.</li>
            <li>O acesso integral às suas informações armazenadas.</li>
            <li>A correção imediata de dados incorretos, incompletos ou desatualizados.</li>
            <li>A revogação do consentimento concedido para fins de atendimento.</li>
          </ul>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            6. Canal de Exclusão de Dados (Data Deletion Instructions)
          </h3>
          <p>
            (Seção obrigatória exigida para homologação e publicação do aplicativo no painel do
            Meta)
          </p>
          <p>
            Caso deseje que a Carro e Cia Motors remova definitivamente seus dados cadastrais de
            leads e o histórico de mensagens armazenado na tabela conversation_history de nossos
            servidores, envie um e-mail com a sua solicitação diretamente para a nossa Encarregada
            de Proteção de Dados (DPO) [2]:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-justify">
            <li>Encarregada Técnica (DPO): Adriana Araújo</li>
            <li>E-mail de Contato para Solicitações: adriana.araujo@carroeciamotors.com.br</li>
            <li>Assunto do E-mail: "Exclusão de Dados Pessoais - LGPD"</li>
            <li>
              Informações Necessárias: Nome completo e o número do celular com WhatsApp (com DDD)
              que deseja excluir do sistema.
            </li>
          </ul>
          <p>
            Nossa equipe técnica executará a exclusão completa dos dados de nossos bancos de dados
            em até 72 horas úteis e enviará um e-mail de confirmação de conclusão do processo.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-left pt-8">
            SEÇÃO 2: TERMOS DE USO DA PLATAFORMA
          </h2>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            1. Escopo e Aceitação dos Termos
          </h3>
          <p>
            Este regulamento estabelece as regras e condições para o uso do nosso website, canais de
            atendimento e assistente de vendas automatizado via WhatsApp. Ao interagir com qualquer
            um destes canais, você concorda com as condições descritas nestes Termos de Uso.
          </p>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            2. Condições de Uso e Obrigações do Usuário
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-justify">
            <li>
              O usuário compromete-se a interagir com os canais de atendimento apenas para fins
              legítimos, como buscar informações de estoque de veículos, simular propostas de
              compra, sanar dúvidas técnicas ou agendar visitas ao nosso showroom em Uberaba - MG.
            </li>
            <li>
              É proibido o envio de mensagens contendo links maliciosos, códigos destrutivos,
              vocabulário obsceno ou tentativas de forçar comportamento inadequado na inteligência
              artificial (prompt injection).
            </li>
          </ul>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            3. Exclusão de Responsabilidade sobre Pré-Propostas
          </h3>
          <p>
            O assistente de inteligência artificial "Luiz" atua como um facilitador de atendimento
            digital para simulação de propostas e consulta de veículos disponíveis [1.3.1]. No
            entanto, todos os valores informados de parcelas, simulações de financiamento bancário,
            avaliações de carros de troca e reservas de estoque possuem caráter meramente
            informativo e preliminar. As negociações comerciais finais só são juridicamente válidas
            quando formalizadas por contrato assinado junto aos nossos gerentes de vendas em nossa
            sede física.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-left pt-8">
            SEÇÃO 3: POLÍTICA DE COOKIES
          </h2>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">1. O que são Cookies?</h3>
          <p>
            Cookies são pequenos arquivos instalados temporariamente no seu computador ou celular
            quando você acessa o nosso site público. Eles ajudam o nosso site a lembrar de suas
            preferências e nos fornecem informações de tráfego.
          </p>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            2. Cookies que Utilizamos em Nosso Site
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-justify">
            <li>
              Cookies Estritamente Necessários: Fundamentais para a segurança das sessões e o
              funcionamento básico das páginas do site.
            </li>
            <li>
              Cookies de Análise e Desempenho (Analytics/Clarity/GTM): Coletam dados de tráfego e
              comportamento do usuário de forma anônima para que possamos avaliar quais veículos do
              nosso estoque são mais visualizados e aprimorar a usabilidade do site para os
              clientes.
            </li>
          </ul>

          <h3 className="text-lg md:text-xl font-semibold text-left pt-4">
            3. Gerenciamento e Controle de Cookies
          </h3>
          <p>
            Você pode recusar, desativar ou limpar todos os cookies armazenados em seu dispositivo a
            qualquer momento alterando as opções de privacidade nas configurações do seu próprio
            navegador de internet. A desativação de determinados cookies poderá afetar o
            carregamento e o desempenho de algumas páginas do nosso portal de veículos.
          </p>
        </div>
      </div>
    </div>
  )
}
