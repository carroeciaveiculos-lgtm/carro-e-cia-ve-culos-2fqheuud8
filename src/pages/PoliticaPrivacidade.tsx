import { SEO } from '@/components/SEO'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'

export default function PoliticaPrivacidade() {
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto animate-in fade-in duration-500">
      <SEO
        title="Política de Privacidade | Carro e Cia Veículos"
        description="Nossa política de privacidade detalha como coletamos, usamos e protegemos seus dados pessoais de acordo com a LGPD e políticas do Meta."
      />

      <Link
        to="/"
        className="inline-flex items-center text-primary hover:underline mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para a página inicial
      </Link>

      <div className="bg-card border border-border rounded-xl p-8 md:p-12 shadow-sm">
        <div className="flex items-center gap-4 mb-8 border-b pb-8">
          <div className="bg-primary/10 p-4 rounded-full">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Política de Privacidade e Termos de Uso
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              SEÇÃO 1 - INFORMAÇÕES GERAIS
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              A presente Política de Privacidade contém informações sobre coleta, uso,
              armazenamento, tratamento e proteção dos dados pessoais dos usuários e visitantes do
              site da <strong>Carro e Cia Veículos</strong>, com a finalidade de demonstrar absoluta
              transparência quanto ao assunto e esclarecer a todos os interessados sobre os tipos de
              dados que são coletados, os motivos da coleta e a forma como os usuários podem
              gerenciar ou excluir as suas informações pessoais.
            </p>
            <p className="leading-relaxed text-muted-foreground mt-4">
              Esta Política de Privacidade aplica-se a todos os usuários e visitantes do site e
              integra os Termos e Condições Gerais de Uso. O presente documento foi elaborado em
              conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei 13.709/18), o Marco
              Civil da Internet (Lei 12.965/14).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              SEÇÃO 2 - CONTROLADOR E CONTATOS
            </h2>
            <div className="bg-muted/50 p-6 rounded-lg border border-border/50">
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Razão Social:</strong> Carro e Cia Veículos
                  Ltda
                </li>
                <li>
                  <strong className="text-foreground">CNPJ:</strong> 17.125.199/0001-87
                </li>
                <li>
                  <strong className="text-foreground">Encarregado de Dados (DPO):</strong> Adriana
                  Araújo
                </li>
                <li>
                  <strong className="text-foreground">E-mail para solicitações LGPD:</strong>{' '}
                  <a
                    href="mailto:adriana.araujo@carroeciamotors.com.br"
                    className="text-primary hover:underline"
                  >
                    adriana.araujo@carroeciamotors.com.br
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              SEÇÃO 3 - QUAIS DADOS COLETAMOS E PARA QUÊ?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Coletamos dados pessoais para oferecer e administrar nossos serviços (compra, venda e
              consignação de veículos, simulações de financiamento e seguros). Os dados incluem:
            </p>
            <ul className="list-disc pl-6 space-y-3 mt-4 text-muted-foreground">
              <li>
                <strong>Dados de Identificação:</strong> Nome, CPF, RG, Data de Nascimento.
              </li>
              <li>
                <strong>Dados de Contato:</strong> E-mail, Telefones, Endereço completo.
              </li>
              <li>
                <strong>Dados do Veículo:</strong> Placa, Renavam, Chassi, Ano/Modelo,
                Quilometragem.
              </li>
              <li>
                <strong>Dados de Navegação e Tracking:</strong> Endereço IP, cookies, informações de
                dispositivo, cliques e navegação (através do Microsoft Clarity e pixels do
                Meta/Google).
              </li>
            </ul>
          </section>

          <section className="my-12 relative">
            <div className="absolute -inset-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-lg z-0 pointer-events-none"></div>
            <div className="relative z-10 p-2">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-500 m-0">
                  SEÇÃO 4 - INSTRUÇÕES PARA EXCLUSÃO DE DADOS (DATA DELETION)
                </h2>
              </div>
              <p className="leading-relaxed text-amber-800 dark:text-amber-200/80 mb-4">
                Em conformidade com a Lei Geral de Proteção de Dados (LGPD) e com os requisitos das
                plataformas de terceiros (como Facebook/Meta e Google), você tem o direito de
                solicitar a exclusão total ou parcial de seus dados pessoais do nosso banco de dados
                a qualquer momento.
              </p>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-500 mb-2">
                Como solicitar a exclusão:
              </h3>
              <ol className="list-decimal pl-6 space-y-2 text-amber-800 dark:text-amber-200/80 font-medium">
                <li>
                  Envie um e-mail diretamente para a nossa DPO, <strong>Adriana Araújo</strong>,
                  através do endereço:{' '}
                  <a
                    href="mailto:adriana.araujo@carroeciamotors.com.br"
                    className="text-amber-600 hover:text-amber-900 underline"
                  >
                    adriana.araujo@carroeciamotors.com.br
                  </a>
                  .
                </li>
                <li>
                  No assunto do e-mail, escreva:{' '}
                  <strong>"Solicitação de Exclusão de Dados - [Seu Nome Completo]"</strong>.
                </li>
                <li>
                  No corpo do e-mail, informe o CPF e o E-mail cadastrado em nossa plataforma para
                  que possamos localizar seu registro.
                </li>
                <li>
                  Nossa equipe processará a exclusão em até <strong>72 horas úteis</strong> e
                  enviará uma confirmação de remoção permanente para o seu e-mail.
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              SEÇÃO 5 - COMPARTILHAMENTO DE DADOS
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Seus dados podem ser compartilhados com parceiros estritamente necessários para a
              prestação dos serviços, tais como:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-muted-foreground">
              <li>Instituições financeiras e bancos (para análise de crédito e financiamento).</li>
              <li>Corretoras de seguros (para cotações de apólices).</li>
              <li>Plataformas de classificados de veículos parceiras.</li>
              <li>
                Ferramentas de marketing (Meta Ads, Google Ads) de forma criptografada para
                otimização de campanhas.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
