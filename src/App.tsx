import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'

import PublicLayout from '@/components/PublicLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import NotFound from './pages/NotFound'
import Index from './pages/Index'

// Fix global para erro do html-to-image (e scripts de terceiros) ao ler cssRules cross-origin
if (typeof window !== 'undefined' && typeof CSSStyleSheet !== 'undefined') {
  const originalCssRules = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules')
  if (originalCssRules) {
    Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
      get() {
        try {
          return originalCssRules.get ? originalCssRules.get.call(this) : []
        } catch (e: any) {
          if (e.name === 'SecurityError') {
            return []
          }
          throw e
        }
      },
      enumerable: originalCssRules.enumerable,
      configurable: originalCssRules.configurable,
    })
  }
}

const DomainRedirect = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      // Redireciona de www e domínios temporários goskip para sem www no domínio de produção
      if (hostname === 'www.carroeciamotors.com.br' || hostname.includes('goskip.app')) {
        window.location.replace(
          `https://carroeciamotors.com.br${window.location.pathname}${window.location.search}`,
        )
      }
    }
  }, [])
  return null
}

// Helper to handle dynamically imported module failures due to stale cache/deployments
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false',
    )
    try {
      const component = await componentImport()
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false')
      return component
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true')
        window.location.reload()
        return new Promise(() => {}) as Promise<any>
      }
      throw error
    }
  })

// Admin Layout lazy loaded to reduce unused JS in public routes
const AdminLayout = lazyWithRetry(() => import('@/components/AdminLayout'))

// Public Pages (Lazy loaded for performance/code-splitting)
const Estoque = lazyWithRetry(() => import('./pages/Estoque'))
const Veiculo = lazyWithRetry(() => import('./pages/Veiculo'))
const Consignacao = lazyWithRetry(() => import('./pages/Consignacao'))
const Sobre = lazyWithRetry(() => import('./pages/Sobre'))
const Contato = lazyWithRetry(() => import('./pages/Contato'))
const PoliticaPrivacidade = lazyWithRetry(() => import('./pages/PoliticaPrivacidade'))
const Seguranca = lazyWithRetry(() => import('./pages/consignacao/Seguranca'))
const Praticidade = lazyWithRetry(() => import('./pages/consignacao/Praticidade'))
const Troca = lazyWithRetry(() => import('./pages/consignacao/Troca'))
const Obrigado = lazyWithRetry(() => import('./pages/Obrigado'))
const SeguroAuto = lazyWithRetry(() => import('./pages/SeguroAuto'))
const ConsorcioAuto = lazyWithRetry(() => import('./pages/ConsorcioAuto'))
const ConsignarMeuCarro = lazyWithRetry(() => import('./pages/ConsignarMeuCarro'))
const ComoFuncionaConsignacao = lazyWithRetry(() => import('./pages/ComoFuncionaConsignacao'))
const FinanciamentoAuto = lazyWithRetry(() => import('./pages/FinanciamentoAuto'))

// Novas LPs e Blog
const CarrosSeminovosUberaba = lazyWithRetry(() => import('./pages/lp/CarrosSeminovosUberaba'))
const VendaCarroRapido = lazyWithRetry(() => import('./pages/lp/VendaCarroRapido'))
const VenderMeuCarro = lazyWithRetry(() => import('./pages/VenderMeuCarro'))
const BlogIndex = lazyWithRetry(() => import('./pages/blog/BlogIndex'))
const BlogPost = lazyWithRetry(() => import('./pages/blog/BlogPost'))

// Admin Pages (Lazy loaded)
const Login = lazyWithRetry(() => import('./pages/admin/Login'))
const Dashboard = lazyWithRetry(() => import('./pages/admin/Dashboard'))
const AdminEstoque = lazyWithRetry(() => import('./pages/admin/Estoque'))
const AdminLeads = lazyWithRetry(() => import('./pages/admin/Leads'))
const Avaliacao = lazyWithRetry(() => import('./pages/admin/Avaliacao'))
const SiteManager = lazyWithRetry(() => import('./pages/admin/SiteManager'))
const Financiamento = lazyWithRetry(() => import('./pages/admin/Financiamento'))
const Administrativo = lazyWithRetry(() => import('./pages/admin/Administrativo'))
const Portais = lazyWithRetry(() => import('./pages/admin/Portais'))
const Relatorios = lazyWithRetry(() => import('./pages/admin/Relatorios'))
const Configuracoes = lazyWithRetry(() => import('./pages/admin/Configuracoes'))
const Usuarios = lazyWithRetry(() => import('./pages/admin/Usuarios'))
const EditUsuario = lazyWithRetry(() => import('./pages/admin/EditUsuario'))
const EmConstrucao = lazyWithRetry(() => import('./pages/admin/EmConstrucao'))

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
  </div>
)

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <DomainRedirect />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/comprar" element={<Navigate to="/estoque" replace />} />
              <Route path="/estoque/:id" element={<Veiculo />} />
              <Route path="/consignacao" element={<Consignacao />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />

              {/* Landing Pages LPs */}
              <Route path="/lp/venda-segura" element={<Seguranca />} />
              <Route path="/lp/venda-rapida" element={<Praticidade />} />
              <Route path="/lp/troca-com-troco" element={<Troca />} />

              {/* LPs SEO */}
              <Route path="/carros-seminovos-uberaba-mg" element={<CarrosSeminovosUberaba />} />
              {/* Redirecionamento da URL antiga para a nova */}
              <Route
                path="/financiamento-veiculo-consignado"
                element={<Navigate to="/financiamento-auto" replace />}
              />
              <Route
                path="/financiamento-veiculos-consignados"
                element={<Navigate to="/financiamento-auto" replace />}
              />
              <Route path="/financiamento-auto" element={<FinanciamentoAuto />} />

              <Route path="/consignar-meu-carro" element={<ConsignarMeuCarro />} />
              <Route path="/como-funciona-a-consignacao" element={<ComoFuncionaConsignacao />} />
              <Route path="/venda-seu-carro-rapido-uberaba" element={<VendaCarroRapido />} />
              <Route path="/vender-meu-carro" element={<VenderMeuCarro />} />

              {/* Blog */}
              <Route path="/blog" element={<BlogIndex />} />
              <Route
                path="/blog/financiamento-carro-cpf-negativado-versao-duplicada"
                element={<Navigate to="/blog/financiamento-com-cpf-negativado" replace />}
              />
              <Route
                path="/blog/seguro-auto-analise-honesta"
                element={<Navigate to="/blog/seguro-auto-vale-a-pena" replace />}
              />
              <Route
                path="/blog/consorcio-ou-financiamento-qual-escolher"
                element={<Navigate to="/blog/consorcio-de-carro-vs-financiamento" replace />}
              />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* Pós-conversão e Serviços (RESTAURADOS) */}
              <Route path="/obrigado" element={<Obrigado />} />
              <Route path="/seguro-auto" element={<SeguroAuto />} />
              <Route path="/consorcio-auto" element={<ConsorcioAuto />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Dashboard />} />

                {/* Module: Estoque */}
                <Route path="estoque" element={<AdminEstoque />} />
                <Route path="estoque/:submenu" element={<EmConstrucao />} />
                <Route path="veiculos" element={<Navigate to="/admin/estoque" replace />} />

                {/* Module: CRM / Leads */}
                <Route path="crm" element={<AdminLeads />} />
                <Route path="crm/:submenu" element={<EmConstrucao />} />

                {/* Module: Avaliação */}
                <Route path="avaliacao" element={<Avaliacao />} />
                <Route path="avaliacao/:submenu" element={<Avaliacao />} />

                {/* Module: Site */}
                <Route path="site" element={<SiteManager />} />
                <Route path="site/:submenu" element={<SiteManager />} />

                {/* Module: Financiamento */}
                <Route path="financiamento" element={<Financiamento />} />
                <Route path="financiamento/:submenu" element={<Financiamento />} />

                {/* Module: Administrativo */}
                <Route path="administrativo" element={<Administrativo />} />
                <Route path="administrativo/:submenu" element={<Administrativo />} />

                <Route path="portais" element={<Portais />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="configuracoes" element={<Configuracoes />} />

                {/* Controle de Acesso */}
                <Route path="usuarios" element={<Usuarios />} />
                <Route path="usuarios/:id" element={<EditUsuario />} />

                <Route path="em-construcao" element={<EmConstrucao />} />
                <Route path="faturas" element={<Navigate to="/admin" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
