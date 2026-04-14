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

// Admin Pages
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import AdminEstoque from './pages/admin/Estoque'
import AdminLeads from './pages/admin/Leads'

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
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="veiculos" element={<AdminEstoque />} />
              <Route path="crm" element={<AdminLeads />} />
              <Route path="consignacoes" element={<Navigate to="/admin/crm" replace />} />
              <Route path="configuracoes" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
