import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import PublicLayout from './components/PublicLayout'
import AdminLayout from './components/AdminLayout'
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
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
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
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="estoque" element={<AdminEstoque />} />
          <Route path="leads" element={<AdminLeads />} />
          {/* Mock redirects for unimplemented admin sections */}
          <Route path="consignacoes" element={<Navigate to="/admin/leads" replace />} />
          <Route path="configuracoes" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
