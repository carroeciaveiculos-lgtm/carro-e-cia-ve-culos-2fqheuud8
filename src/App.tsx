import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'

// Redirecionamento 301 (Client-side) do domínio antigo para o novo
if (typeof window !== 'undefined' && window.location.hostname === 'carroeciaveiculos.goskip.app') {
  window.location.replace(
    `https://carroeciamotors.com.br${window.location.pathname}${window.location.search}`,
  )
}
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'

import PublicLayout from '@/components/PublicLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import NotFound from './pages/NotFound'

// Admin Layout lazy loaded to reduce unused JS in public routes
const AdminLayout = lazy(() => import('@/components/AdminLayout'))

// Public Pages (Lazy loaded for performance/code-splitting)
const Index = lazy(() => import('./pages/Index'))
const Estoque = lazy(() => import('./pages/Estoque'))
const Veiculo = lazy(() => import('./pages/Veiculo'))
const Consignacao = lazy(() => import('./pages/Consignacao'))
const Sobre = lazy(() => import('./pages/Sobre'))
const Contato = lazy(() => import('./pages/Contato'))
const PoliticaPrivacidade = lazy(() => import('./pages/PoliticaPrivacidade'))
const Seguranca = lazy(() => import('./pages/consignacao/Seguranca'))
const Praticidade = lazy(() => import('./pages/consignacao/Praticidade'))
const Troca = lazy(() => import('./pages/consignacao/Troca'))
const Obrigado = lazy(() => import('./pages/Obrigado'))
const SeguroAuto = lazy(() => import('./pages/SeguroAuto'))
const ConsorcioAuto = lazy(() => import('./pages/ConsorcioAuto'))

// Novas LPs e Blog
const CarrosSeminovosUberaba = lazy(() => import('./pages/lp/CarrosSeminovosUberaba'))
const FinanciamentoConsignado = lazy(() => import('./pages/lp/FinanciamentoConsignado'))
const VendaCarroRapido = lazy(() => import('./pages/lp/VendaCarroRapido'))
const VenderMeuCarro = lazy(() => import('./pages/VenderMeuCarro'))
const BlogIndex = lazy(() => import('./pages/blog/BlogIndex'))
const BlogPost = lazy(() => import('./pages/blog/BlogPost'))

// Admin Pages (Lazy loaded)
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminEstoque = lazy(() => import('./pages/admin/Estoque'))
const AdminLeads = lazy(() => import('./pages/admin/Leads'))
const Avaliacao = lazy(() => import('./pages/admin/Avaliacao'))
const SiteManager = lazy(() => import('./pages/admin/SiteManager'))
const Financiamento = lazy(() => import('./pages/admin/Financiamento'))
const Administrativo = lazy(() => import('./pages/admin/Administrativo'))
const Portais = lazy(() => import('./pages/admin/Portais'))
const Relatorios = lazy(() => import('./pages/admin/Relatorios'))
const Configuracoes = lazy(() => import('./pages/admin/Configuracoes'))
const Usuarios = lazy(() => import('./pages/admin/Usuarios'))
const EditUsuario = lazy(() => import('./pages/admin/EditUsuario'))
const EmConstrucao = lazy(() => import('./pages/admin/EmConstrucao'))

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
  </div>
)

const App = () => (
  <AuthProvider>
    <BrowserRouter>
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
              <Route
                path="/financiamento-veiculo-consignado"
                element={<FinanciamentoConsignado />}
              />
              <Route path="/venda-seu-carro-rapido-uberaba" element={<VendaCarroRapido />} />
              <Route path="/vender-meu-carro" element={<VenderMeuCarro />} />

              {/* Blog */}
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* Pós-conversão e Serviços */}
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
