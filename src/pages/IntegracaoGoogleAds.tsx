import { SEO } from '@/components/SEO'
import { Link } from 'react-router-dom'
import { ArrowLeft, Megaphone } from 'lucide-react'

export default function IntegracaoGoogleAds() {
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto animate-in fade-in duration-500">
      <SEO
        title="Carro e Cia — Gestão de Anúncios Google Ads"
        description="Ferramenta interna da Carro e Cia Motors para monitorar e gerenciar as campanhas de anúncios Google Ads da revenda."
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
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Carro e Cia — Gestão de Anúncios Google Ads
            </h1>
            <p className="text-muted-foreground mt-1">
              TRANSLUGA ADMINISTRADORA DE VEÍCULOS LTDA (CARRO E CIA MOTORS) — CNPJ:
              10.196.974/0001-46
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-justify text-foreground space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-left pt-2">O que é este app</h2>
          <p>
            "Carro e Cia — Gestão de Anúncios Google Ads" é uma ferramenta{' '}
            <strong>interna</strong>, usada só pela nossa própria equipe (administradores
            autorizados do painel de gestão da Carro e Cia Motors), para acompanhar e gerenciar as
            campanhas de anúncios que a própria revenda mantém na plataforma Google Ads.
          </p>
          <p>
            Não é um produto oferecido a clientes, ao público em geral ou a terceiros — é
            exclusivamente um painel de uso interno para a nossa própria conta de anúncios.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-left pt-4">O que o app faz</h2>
          <ul className="list-disc pl-6 space-y-2 text-justify">
            <li>Lista as campanhas de anúncios ativas na nossa conta Google Ads.</li>
            <li>
              Mostra métricas de desempenho (impressões, cliques, custo, conversões) e o gasto
              atual em relação ao limite de cobrança da conta.
            </li>
            <li>Exibe recomendações que a própria plataforma Google Ads sugere para a conta.</li>
            <li>
              Permite solicitar ajuste de orçamento diário ou status (ativar/pausar) de uma
              campanha — toda solicitação fica pendente numa fila de aprovação interna e só é
              enviada à API do Google depois de confirmada manualmente por um responsável; nenhum
              ajuste é aplicado automaticamente sem essa aprovação.
            </li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold text-left pt-4">
            Por que pedimos acesso aos seus dados do Google
          </h2>
          <p>
            O app usa a API do Google Ads (escopo <code>https://www.googleapis.com/auth/adwords</code>)
            unicamente para ler e gerenciar os dados da nossa própria conta de anúncios (campanhas,
            orçamentos, métricas e recomendações) — não acessa e-mail, contatos, arquivos, agenda
            ou qualquer outro dado pessoal da conta Google usada para autorizar o acesso, além do
            estritamente necessário para operar a conta de anúncios em si.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-left pt-4">Política de Privacidade</h2>
          <p>
            O tratamento de dados relacionado a este app está detalhado na nossa{' '}
            <Link to="/politica-de-privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
            , Seção 4 — "Integração Google Ads".
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-left pt-4">Contato</h2>
          <p>
            Responsável Técnica: Adriana Araújo —{' '}
            <a
              href="mailto:adriana.araujo@carroeciamotors.com.br"
              className="text-primary hover:underline"
            >
              adriana.araujo@carroeciamotors.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
