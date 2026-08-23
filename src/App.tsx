import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { handleImageError } from '@/lib/image-utils'
import { capturarAtribuicaoAnuncio } from '@/lib/ad-tracking'

import PublicLayout from '@/components/PublicLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CookieConsent } from '@/components/CookieConsent'
import { useScrollTracking } from '@/hooks/use-scroll-tracking'
import { useLocation } from 'react-router-dom'
import NotFound from './pages/NotFound'
import Index from './pages/Index'

// Fix global para erro de parse JSON em respostas com corpo vazio (ex: requisições HEAD) e falhas de rede
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    const reqUrl =
      typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : ''
    if (reqUrl.includes('imagens.carroeciamotors.com.br')) {
      try {
        return await originalFetch.apply(this, args)
      } catch (e) {
        console.debug('R2 CDN fetch silently failed (likely html-to-image CORS)')
        return new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    if (
      reqUrl.includes('htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/')
    ) {
      try {
        const response = await originalFetch.apply(this, args)
        if (!response.ok) {
          console.debug(
            'Supabase storage image request failed (%d), returning placeholder',
            response.status,
          )
          return new Response('', {
            status: 200,
            headers: { 'Content-Type': 'image/png' },
          })
        }
        return response
      } catch (e) {
        console.debug('Supabase storage image fetch silently failed')
        return new Response('', {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        })
      }
    }
    try {
      const response = await originalFetch.apply(this, args)
      const reqMethod = (
        args[1]?.method || (args[0] instanceof Request ? args[0].method : 'GET')
      ).toUpperCase()

      if (reqMethod === 'HEAD' || response.status === 204) {
        return new Response('{}', {
          status: response.status === 204 ? 200 : response.status,
          statusText: response.statusText,
          headers: response.headers,
        })
      }
      return response
    } catch (error: any) {
      const url =
        typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : ''
      const method = (
        args[1]?.method || (args[0] instanceof Request ? args[0].method : 'GET')
      ).toUpperCase()

      if (method === 'HEAD' && url.includes('veiculos')) {
        console.warn(
          'Interceptado erro de rede na requisição HEAD para veiculos. Retornando fallback.',
          error,
        )
        return new Response('{}', {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Range': '0-0/0',
          },
        })
      }

      if (url.includes('/functions/v1/')) {
        const funcName = url.match(/\/functions\/v1\/([^/?]+)/)?.[1] || 'unknown'
        console.debug(`Edge function "${funcName}" fetch failed (network error):`, error?.message)
        return new Response(
          JSON.stringify({
            error: true,
            message: `Network error: ${error?.message || 'Failed to fetch'}`,
            status: 0,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      throw error
    }
  }
}

// Fallback global para imagens quebradas para não quebrar a UI e bibliotecas como html-to-image
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (e) => {
      const target = e.target as HTMLElement
      if (target && target.tagName === 'IMG') {
        handleImageError(target as HTMLImageElement, 'global-fallback')
      }
    },
    true,
  )
}

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
const Servicos = lazyWithRetry(() => import('./pages/Servicos'))
const Contato = lazyWithRetry(() => import('./pages/Contato'))
const TrabalheConosco = lazyWithRetry(() => import('./pages/TrabalheConosco'))
const VagaDetalhe = lazyWithRetry(() => import('./pages/VagaDetalhe'))
const PoliticaPrivacidade = lazyWithRetry(() => import('./pages/PoliticaPrivacidade'))
const Termos = lazyWithRetry(() => import('./pages/Termos'))
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
const RedefinirSenha = lazyWithRetry(() => import('./pages/admin/RedefinirSenha'))
const Dashboard = lazyWithRetry(() => import('./pages/admin/Dashboard'))
const AdminEstoque = lazyWithRetry(() => import('./pages/admin/Estoque'))
const AdminLeads = lazyWithRetry(() => import('./pages/admin/Leads'))
const Conversas = lazyWithRetry(() => import('./pages/admin/Conversas'))
const Agendamentos = lazyWithRetry(() => import('./pages/admin/Agendamentos'))
const Design = lazyWithRetry(() => import('./pages/admin/Design'))
const Financiamento = lazyWithRetry(() => import('./pages/admin/Financiamento'))
const Avaliacao = lazyWithRetry(() => import('./pages/admin/Avaliacao'))
const Administrativo = lazyWithRetry(() => import('./pages/admin/Administrativo'))
const Portais = lazyWithRetry(() => import('./pages/admin/Portais'))
const VagasAdmin = lazyWithRetry(() => import('./pages/admin/Vagas'))
const PortalReview = lazyWithRetry(() => import('./pages/admin/PortalReview'))
const MLDiagnosis = lazyWithRetry(() => import('./pages/admin/MLDiagnosis'))
const Relatorios = lazyWithRetry(() => import('./pages/admin/Relatorios'))
const Configuracoes = lazyWithRetry(() => import('./pages/admin/Configuracoes'))
const Logs = lazyWithRetry(() => import('./pages/admin/Logs'))
const Usuarios = lazyWithRetry(() => import('./pages/admin/Usuarios'))
const EditUsuario = lazyWithRetry(() => import('./pages/admin/EditUsuario'))
const EmConstrucao = lazyWithRetry(() => import('./pages/admin/EmConstrucao'))
const CentralSocial = lazyWithRetry(() => import('./pages/admin/CentralSocial'))
const Conteudo = lazyWithRetry(() => import('./pages/admin/Conteudo'))
const Auditoria = lazyWithRetry(() => import('./pages/admin/Auditoria'))
const Marketing = lazyWithRetry(() => import('./pages/admin/Marketing'))
const Ajuda = lazyWithRetry(() => import('./pages/admin/Ajuda'))
const AdsManager = lazyWithRetry(() => import('./pages/admin/AdsManager'))
const Autonomia = lazyWithRetry(() => import('./pages/admin/Autonomia'))
const PromptsIA = lazyWithRetry(() => import('./pages/admin/PromptsIA'))
const DocumentTemplates = lazyWithRetry(() => import('./pages/admin/DocumentTemplates'))

// MotoresHub Pages (Lazy loaded)
const HubLogin = lazyWithRetry(() => import('./hub/pages/Login'))
const HubLogout = lazyWithRetry(() => import('./hub/pages/Logout'))
const HubDashboard = lazyWithRetry(() => import('./hub/pages/Dashboard'))
const HubBranding = lazyWithRetry(() => import('./hub/pages/Branding'))
const HubScripts = lazyWithRetry(() => import('./hub/pages/Scripts'))
const HubMediaCenter = lazyWithRetry(() => import('./hub/pages/MediaCenter'))
const HubLayout = lazyWithRetry(() => import('./hub/components/Layout'))
import { HubProtectedRoute } from './hub/components/ProtectedRoute'

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background w-full gap-4">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="text-muted-foreground font-medium animate-pulse">Carregando...</p>
  </div>
)

const GlobalHooks = () => {
  useScrollTracking()
  const location = useLocation()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).dataLayer) {
        ;(window as any).dataLayer.push({
          event: 'page_view',
          page_path: location.pathname + location.search,
        })
      }
      if ((window as any).fbq) {
        ;(window as any).fbq('track', 'PageView')
      }
      capturarAtribuicaoAnuncio()
    }
  }, [location])

  return null
}

const ShareRedirect = () => {
  const { slug } = useParams()
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    const isBot = [
      'whatsapp',
      'facebook',
      'facebot',
      'twitter',
      'telegram',
      'googlebot',
      'bingbot',
      'bot',
      'crawler',
      'spider',
    ].some((p) => ua.includes(p))
    if (!isBot) {
      window.location.replace(`/estoque/${slug}`)
    }
  }, [slug])
  return null
}

const MainApp = () => (
  <Routes>
    {/* Public Routes */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Index />} />
      <Route path="/estoque" element={<Estoque />} />
      <Route path="/comprar" element={<Navigate to="/estoque" replace />} />
      <Route path="/estoque/:id" element={<Veiculo />} />
      <Route path="/s/:slug" element={<ShareRedirect />} />
      <Route path="/consignacao" element={<Consignacao />} />
      <Route path="/sobre" element={<Sobre />} />
      <Route path="/servicos" element={<Servicos />} />
      <Route path="/contato" element={<Contato />} />
      <Route path="/trabalhe-conosco" element={<TrabalheConosco />} />
      <Route path="/vagas/:id" element={<VagaDetalhe />} />
      <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
      <Route path="/termos" element={<Termos />} />

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
    <Route path="/admin/redefinir-senha" element={<RedefinirSenha />} />
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
        <Route path="conversas" element={<Conversas />} />
        <Route path="agendamentos" element={<Agendamentos />} />

        {/* Module: Avaliação */}

        {/* Module: Design */}
        <Route path="design" element={<Design />} />
        <Route path="design/:submenu" element={<Design />} />

        {/* Module: Financiamento */}
        <Route path="financiamento" element={<Financiamento />} />
        <Route path="avaliacao" element={<Avaliacao />} />
        <Route path="financiamento/:submenu" element={<Financiamento />} />

        {/* Module: Administrativo */}
        <Route path="administrativo" element={<Administrativo />} />
        <Route path="administrativo/:submenu" element={<Administrativo />} />

        <Route path="portais" element={<Portais />} />
        <Route path="vagas" element={<VagasAdmin />} />
        <Route path="portais/revisao" element={<PortalReview />} />
        <Route path="ml-diagnosis" element={<MLDiagnosis />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="logs" element={<Logs />} />

        <Route path="central-social" element={<CentralSocial />} />
        <Route path="redes-sociais" element={<Navigate to="/admin/central-social" replace />} />
        <Route
          path="social-comentarios"
          element={<Navigate to="/admin/central-social" replace />}
        />
        <Route path="moderador-posts" element={<Navigate to="/admin/central-social" replace />} />
        <Route path="conteudo" element={<Conteudo />} />

        <Route path="auditoria" element={<Auditoria />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="anuncios" element={<AdsManager />} />
        <Route path="autonomia" element={<Autonomia />} />
        <Route path="prompts-ia" element={<PromptsIA />} />
        <Route path="modelos-documentos" element={<DocumentTemplates />} />
        <Route path="ajuda" element={<Ajuda />} />

        {/* Controle de Acesso */}
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="usuarios/:id" element={<EditUsuario />} />

        <Route path="em-construcao" element={<EmConstrucao />} />
        <Route path="faturas" element={<Navigate to="/admin" replace />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
)

const HubApp = () => {
  const isSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('hub.')
  const basePath = isSubdomain ? '' : '/hub'

  return (
    <Routes>
      <Route path={`${basePath}/login`} element={<HubLogin />} />
      <Route path={`${basePath}/logout`} element={<HubLogout />} />
      <Route path={`${basePath}`} element={<HubProtectedRoute />}>
        <Route element={<HubLayout />}>
          <Route index element={<HubDashboard />} />
          <Route path="estoque" element={<AdminEstoque />} />
          <Route path="design" element={<Design />} />
          <Route path="conteudo" element={<Conteudo />} />
          <Route path="branding" element={<HubBranding />} />
          <Route path="scripts" element={<HubScripts />} />
          <Route path="media" element={<HubMediaCenter />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={`${basePath}/`} replace />} />
    </Routes>
  )
}

const App = () => {
  const isSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('hub.')
  const isHubPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/hub')
  const isHub = isSubdomain || isHubPath

  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalHooks />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CookieConsent />
          <Suspense fallback={<PageLoader />}>{isHub ? <HubApp /> : <MainApp />}</Suspense>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
