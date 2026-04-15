import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'

import PublicLayout from './components/PublicLayout'
import AdminLayout from './components/AdminLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import NotFound from './pages/NotFound'

// Public Pages
import Index from './pages/Index'
import Estoque from './pages/Estoque'
import Veiculo from './pages/Veiculo'
import Consignacao from './pages/Consignacao'
import Sobre from './pages/Sobre'
import Contato from './pages/Contato'
import Seguranca from './pages/consignacao/Seguranca'
import Praticidade from './pages/consignacao/Praticidade'
import Troca from './pages/consignacao/Troca'
import Obrigado from './pages/Obrigado'
import SeguroAuto from './pages/SeguroAuto'
import ConsorcioAuto from './pages/ConsorcioAuto'

// Admin Pages
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import AdminEstoque from './pages/admin/Estoque'
import AdminLeads from './pages/admin/Leads'
import Portais from './pages/admin/Portais'
import Relatorios from './pages/admin/Relatorios'
import Configuracoes from './pages/admin/Configuracoes'
import Usuarios from './pages/admin/Usuarios'
import EditUsuario from './pages/admin/EditUsuario'
import EmConstrucao from './pages/admin/EmConstrucao'

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/estoque/:id" element={<Veiculo />} />
            <Route path="/consignacao" element={<Consignacao />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/contato" element={<Contato />} />

            {/* Landing Pages LPs */}
            <Route path="/lp/venda-segura" element={<Seguranca />} />
            <Route path="/lp/venda-rapida" element={<Praticidade />} />
            <Route path="/lp/troca-com-troco" element={<Troca />} />

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
              <Route path="estoque" element={<AdminEstoque />} />
              <Route path="veiculos" element={<Navigate to="/admin/estoque" replace />} />
              <Route path="crm" element={<AdminLeads />} />
              <Route path="portais" element={<Portais />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="configuracoes" element={<Configuracoes />} />

              {/* Controle de Acesso */}
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="usuarios/:id" element={<EditUsuario />} />

              {/* Módulos em Construção */}
              <Route path="site" element={<EmConstrucao />} />
              <Route path="avaliacao" element={<EmConstrucao />} />
              <Route path="marketing" element={<EmConstrucao />} />
              <Route path="suporte" element={<EmConstrucao />} />
              <Route path="agenda" element={<EmConstrucao />} />
              <Route path="em-construcao" element={<EmConstrucao />} />

              <Route path="faturas" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
