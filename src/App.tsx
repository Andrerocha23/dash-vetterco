import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AuthPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Boards from "./pages/Boards";
// ❌ REMOVIDO: import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Accounts from "./pages/ContasCliente";
import Clientes from "./pages/Clientes";
import ClienteDetail from "./pages/ClienteDetail";
import Analytics from "./pages/Analytics";
import Templates from "./pages/Templates";
import Training from "./pages/Training";
import TrainingDetail from "./pages/TrainingDetail";
import AddTraining from "./pages/AddTraining";
import Managers from "./pages/Managers";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Feedbacks from "./pages/Feedbacks";
import RelatorioN8n from "./pages/RelatorioN8n";
import NotFound from "./pages/NotFound";
import MetaConfigPage from './pages/MetaConfigPage';
import PublicClientRegistration from './pages/PublicClientRegistration';
import ClientRegistrations from './pages/ClientRegistrations';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/boards" element={
              <ProtectedRoute>
                <Boards />
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            } />
            <Route path="/clientes/:id" element={
              <ProtectedRoute>
                <ClienteDetail />
              </ProtectedRoute>
            } />
            <Route path="/contas" element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            } />
            <Route path="/contas/:id" element={
              <ProtectedRoute>
                <ClientDetail />
              </ProtectedRoute>
            } />
            {/* ❌ REMOVIDO: Rotas /clients e /clients/:id */}
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            } />
            <Route path="/capacitacao" element={
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            } />
            <Route path="/capacitacao/:id" element={
              <ProtectedRoute>
                <TrainingDetail />
              </ProtectedRoute>
            } />
            <Route path="/capacitacao/adicionar" element={
              <ProtectedRoute>
                <AddTraining />
              </ProtectedRoute>
            } />
            <Route path="/gestores" element={
              <ProtectedRoute>
                <Managers />
              </ProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/configuracao" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/feedbacks" element={
              <ProtectedRoute>
                <Feedbacks />
              </ProtectedRoute>
            } />
            <Route path="/settings/meta" element={
              <ProtectedRoute>
                <MetaConfigPage />
              </ProtectedRoute>
            } />
            <Route path="/relatorio-n8n" element={
              <ProtectedRoute>
                <RelatorioN8n />
              </ProtectedRoute>
            } />
            <Route path="/cadastro-cliente" element={<PublicClientRegistration />} />
            <Route path="/cadastros" element={
              <ProtectedRoute>
                <ClientRegistrations />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;